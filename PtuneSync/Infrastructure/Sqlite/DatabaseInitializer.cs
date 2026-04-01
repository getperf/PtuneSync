using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;

namespace PtuneSync.Infrastructure.Sqlite;

public sealed class DatabaseInitializer
{
    private readonly SqliteConnectionFactory _connectionFactory;
    private readonly SqlScriptLoader _scriptLoader;

    public DatabaseInitializer()
        : this(new SqliteConnectionFactory(), new SqlScriptLoader())
    {
    }

    public DatabaseInitializer(SqliteConnectionFactory connectionFactory, SqlScriptLoader scriptLoader)
    {
        _connectionFactory = connectionFactory;
        _scriptLoader = scriptLoader;
    }

    public async Task EnsureAsync(string dbPath, CancellationToken cancellationToken = default)
    {
        var directory = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        AppLog.Info("[DatabaseInitializer] Ensure start dbPath={DbPath}", dbPath);
        await using var connection = await _connectionFactory.OpenAsync(dbPath, cancellationToken);
        await using var dbTransaction = await connection.BeginTransactionAsync(cancellationToken);
        var transaction = (SqliteTransaction)dbTransaction;

        var currentVersion = await GetCurrentVersionAsync(connection, transaction, cancellationToken);
        var targetVersion = DatabaseVersionManager.CurrentVersion;
        AppLog.Debug("[DatabaseInitializer] currentVersion={CurrentVersion} targetVersion={TargetVersion}", currentVersion?.ToString() ?? "<null>", targetVersion);

        if (currentVersion == null)
        {
            AppLog.Info("[DatabaseInitializer] No schema_version table found. Initializing schema.");
            await ExecuteScriptAsync(connection, transaction, _scriptLoader.LoadSchema(), cancellationToken);
            await SetVersionAsync(connection, transaction, targetVersion, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            AppLog.Info("[DatabaseInitializer] Database initialized version={Version}", targetVersion);
            return;
        }

        if (currentVersion >= targetVersion)
        {
            await transaction.CommitAsync(cancellationToken);
            AppLog.Info("[DatabaseInitializer] Schema already current version={Version}", currentVersion);
            return;
        }

        for (var version = currentVersion.Value + 1; version <= targetVersion; version++)
        {
            AppLog.Info("[DatabaseInitializer] Applying migration -> v{Version}", version);
            await ExecuteScriptAsync(connection, transaction, _scriptLoader.LoadMigration(version), cancellationToken);
            await SetVersionAsync(connection, transaction, version, cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        AppLog.Info("[DatabaseInitializer] Migration complete version={Version}", targetVersion);
    }

    private static async Task<int?> GetCurrentVersionAsync(SqliteConnection connection, SqliteTransaction transaction, CancellationToken cancellationToken)
    {
        await using var existsCommand = connection.CreateCommand();
        existsCommand.Transaction = transaction;
        existsCommand.CommandText =
            """
            SELECT name
            FROM sqlite_master
            WHERE type='table' AND name='schema_version';
            """;

        var exists = await existsCommand.ExecuteScalarAsync(cancellationToken);
        if (exists == null || exists == DBNull.Value)
        {
            return null;
        }

        await using var versionCommand = connection.CreateCommand();
        versionCommand.Transaction = transaction;
        versionCommand.CommandText = "SELECT version FROM schema_version LIMIT 1;";
        var value = await versionCommand.ExecuteScalarAsync(cancellationToken);
        if (value == null || value == DBNull.Value)
        {
            return null;
        }

        return Convert.ToInt32(value);
    }

    private static async Task SetVersionAsync(SqliteConnection connection, SqliteTransaction transaction, int version, CancellationToken cancellationToken)
    {
        AppLog.Debug("[DatabaseInitializer] Setting schema version={Version}", version);

        await using var deleteCommand = connection.CreateCommand();
        deleteCommand.Transaction = transaction;
        deleteCommand.CommandText = "DELETE FROM schema_version;";
        await deleteCommand.ExecuteNonQueryAsync(cancellationToken);

        await using var insertCommand = connection.CreateCommand();
        insertCommand.Transaction = transaction;
        insertCommand.CommandText = "INSERT INTO schema_version (version) VALUES ($version);";
        insertCommand.Parameters.AddWithValue("$version", version);
        await insertCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task ExecuteScriptAsync(SqliteConnection connection, SqliteTransaction transaction, string sql, CancellationToken cancellationToken)
    {
        foreach (var statement in SplitStatements(sql))
        {
            AppLog.Debug("[DatabaseInitializer] Executing SQL: {Statement}", statement);
            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = statement;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private static IEnumerable<string> SplitStatements(string sql)
    {
        foreach (var chunk in sql.Split(';'))
        {
            var statement = chunk.Trim();
            if (string.IsNullOrWhiteSpace(statement))
            {
                continue;
            }

            yield return statement + ";";
        }
    }
}

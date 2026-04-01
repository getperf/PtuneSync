using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;

namespace PtuneSync.Infrastructure.Sqlite;

public sealed class SqliteConnectionFactory
{
    public async Task<SqliteConnection> OpenAsync(string dbPath, CancellationToken cancellationToken = default)
    {
        var builder = new SqliteConnectionStringBuilder
        {
            DataSource = dbPath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
        };

        AppLog.Debug("[SqliteConnectionFactory] Opening SQLite connection: {DbPath}", dbPath);
        var connection = new SqliteConnection(builder.ToString());
        await connection.OpenAsync(cancellationToken);

        await using var pragma = connection.CreateCommand();
        pragma.CommandText = "PRAGMA foreign_keys = ON;";
        await pragma.ExecuteNonQueryAsync(cancellationToken);
        AppLog.Debug("[SqliteConnectionFactory] foreign_keys pragma enabled");

        return connection;
    }
}

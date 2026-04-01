using System.Threading;
using System.Threading.Tasks;

namespace PtuneSync.Infrastructure.Sqlite;

public sealed class DatabaseRuntimeFactory
{
    private readonly DatabaseInitializer _initializer;
    private readonly SqliteConnectionFactory _connectionFactory;

    public DatabaseRuntimeFactory()
        : this(new DatabaseInitializer(), new SqliteConnectionFactory())
    {
    }

    public DatabaseRuntimeFactory(DatabaseInitializer initializer, SqliteConnectionFactory connectionFactory)
    {
        _initializer = initializer;
        _connectionFactory = connectionFactory;
    }

    public async Task<DatabaseRuntime> CreateForVaultAsync(string vaultHome, CancellationToken cancellationToken = default)
    {
        AppConfigManager.RememberVaultHome(vaultHome);
        var dbPath = DbPathResolver.ResolveCurrent(vaultHome);
        AppLog.Info("[DatabaseRuntimeFactory] CreateForVaultAsync vaultHome={VaultHome} dbPath={DbPath}", vaultHome, dbPath);

        await _initializer.EnsureAsync(dbPath, cancellationToken);
        return new DatabaseRuntime(dbPath, _connectionFactory);
    }
}

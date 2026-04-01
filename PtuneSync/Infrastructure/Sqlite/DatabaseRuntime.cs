using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;

namespace PtuneSync.Infrastructure.Sqlite;

public sealed class DatabaseRuntime
{
    private readonly SqliteConnectionFactory _connectionFactory;

    public DatabaseRuntime(string dbPath, SqliteConnectionFactory connectionFactory)
    {
        DbPath = dbPath;
        _connectionFactory = connectionFactory;
    }

    public string DbPath { get; }

    public Task<SqliteConnection> OpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        return _connectionFactory.OpenAsync(DbPath, cancellationToken);
    }
}

namespace PtuneSync.Infrastructure.Sqlite;

public sealed record PullSyncRecord(
    int AcceptedCount,
    int AddedCount,
    int UpdatedCount,
    int DeletedCount);

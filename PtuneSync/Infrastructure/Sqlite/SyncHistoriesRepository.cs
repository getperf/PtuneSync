using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;

namespace PtuneSync.Infrastructure.Sqlite;

public sealed class SyncHistoriesRepository
{
    public async Task CreateAsync(
        SqliteConnection connection,
        SqliteTransaction transaction,
        string id,
        string command,
        string status,
        string listName,
        string? dailyNoteKey,
        string startedAt,
        CancellationToken cancellationToken = default)
    {
        await using var commandObject = connection.CreateCommand();
        commandObject.Transaction = transaction;
        commandObject.CommandText =
            """
            INSERT INTO sync_histories (
                id,
                command,
                status,
                list_name,
                daily_note_key,
                started_at,
                completed_at,
                accepted_count,
                added_count,
                updated_count,
                deleted_count,
                note
            )
            VALUES (
                $id,
                $command,
                $status,
                $listName,
                $dailyNoteKey,
                $startedAt,
                NULL,
                0,
                0,
                0,
                0,
                NULL
            );
            """;
        commandObject.Parameters.AddWithValue("$id", id);
        commandObject.Parameters.AddWithValue("$command", command);
        commandObject.Parameters.AddWithValue("$status", status);
        commandObject.Parameters.AddWithValue("$listName", listName);
        commandObject.Parameters.AddWithValue("$dailyNoteKey", dailyNoteKey ?? (object)DBNull.Value);
        commandObject.Parameters.AddWithValue("$startedAt", startedAt);
        await commandObject.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task CompleteAsync(
        SqliteConnection connection,
        SqliteTransaction transaction,
        string id,
        string status,
        string completedAt,
        PullSyncRecord record,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        await using var commandObject = connection.CreateCommand();
        commandObject.Transaction = transaction;
        commandObject.CommandText =
            """
            UPDATE sync_histories
            SET status = $status,
                completed_at = $completedAt,
                accepted_count = $acceptedCount,
                added_count = $addedCount,
                updated_count = $updatedCount,
                deleted_count = $deletedCount,
                note = $note
            WHERE id = $id;
            """;
        commandObject.Parameters.AddWithValue("$id", id);
        commandObject.Parameters.AddWithValue("$status", status);
        commandObject.Parameters.AddWithValue("$completedAt", completedAt);
        commandObject.Parameters.AddWithValue("$acceptedCount", record.AcceptedCount);
        commandObject.Parameters.AddWithValue("$addedCount", record.AddedCount);
        commandObject.Parameters.AddWithValue("$updatedCount", record.UpdatedCount);
        commandObject.Parameters.AddWithValue("$deletedCount", record.DeletedCount);
        commandObject.Parameters.AddWithValue("$note", note ?? (object)DBNull.Value);
        await commandObject.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task FailAsync(
        SqliteConnection connection,
        SqliteTransaction transaction,
        string id,
        string completedAt,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        await using var commandObject = connection.CreateCommand();
        commandObject.Transaction = transaction;
        commandObject.CommandText =
            """
            UPDATE sync_histories
            SET status = 'error',
                completed_at = $completedAt,
                note = $note
            WHERE id = $id;
            """;
        commandObject.Parameters.AddWithValue("$id", id);
        commandObject.Parameters.AddWithValue("$completedAt", completedAt);
        commandObject.Parameters.AddWithValue("$note", note ?? (object)DBNull.Value);
        await commandObject.ExecuteNonQueryAsync(cancellationToken);
    }
}

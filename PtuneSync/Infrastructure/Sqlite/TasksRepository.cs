using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using PtuneSync.Models;

namespace PtuneSync.Infrastructure.Sqlite;

public sealed class TasksRepository
{
    public async Task<PullSyncRecord> UpsertPulledTasksAsync(
        SqliteConnection connection,
        SqliteTransaction transaction,
        string listName,
        IReadOnlyCollection<MyTask> tasks,
        string pulledAt,
        CancellationToken cancellationToken = default)
    {
        var existingIds = new HashSet<string>(StringComparer.Ordinal);

        await using (var existingCommand = connection.CreateCommand())
        {
            existingCommand.Transaction = transaction;
            existingCommand.CommandText = "SELECT id FROM tasks WHERE list_name = $listName;";
            existingCommand.Parameters.AddWithValue("$listName", listName);

            await using var reader = await existingCommand.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                existingIds.Add(reader.GetString(0));
            }
        }

        var fetchedIds = new HashSet<string>(StringComparer.Ordinal);
        var addedCount = 0;
        var updatedCount = 0;

        foreach (var task in tasks)
        {
            if (string.IsNullOrWhiteSpace(task.Id))
            {
                continue;
            }

            fetchedIds.Add(task.Id);
            if (existingIds.Contains(task.Id))
            {
                updatedCount++;
            }
            else
            {
                addedCount++;
            }

            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText =
                """
                INSERT INTO tasks (
                    id,
                    list_name,
                    title,
                    status,
                    parent,
                    started,
                    completed,
                    pomodoro_planned,
                    pomodoro_actual,
                    review_flags_json,
                    goal,
                    tags_json,
                    google_updated_at,
                    last_pulled_at,
                    last_pushed_at,
                    deleted_at
                )
                VALUES (
                    $id,
                    $listName,
                    $title,
                    $status,
                    $parent,
                    $started,
                    $completed,
                    $pomodoroPlanned,
                    $pomodoroActual,
                    $reviewFlagsJson,
                    $goal,
                    $tagsJson,
                    $googleUpdatedAt,
                    $lastPulledAt,
                    NULL,
                    $deletedAt
                )
                ON CONFLICT(id) DO UPDATE SET
                    list_name = excluded.list_name,
                    title = excluded.title,
                    status = excluded.status,
                    parent = excluded.parent,
                    started = excluded.started,
                    completed = excluded.completed,
                    pomodoro_planned = excluded.pomodoro_planned,
                    pomodoro_actual = excluded.pomodoro_actual,
                    review_flags_json = excluded.review_flags_json,
                    goal = excluded.goal,
                    tags_json = excluded.tags_json,
                    google_updated_at = excluded.google_updated_at,
                    last_pulled_at = excluded.last_pulled_at,
                    deleted_at = excluded.deleted_at;
                """;

            command.Parameters.AddWithValue("$id", task.Id);
            command.Parameters.AddWithValue("$listName", listName);
            command.Parameters.AddWithValue("$title", task.Title);
            command.Parameters.AddWithValue("$status", task.Status);
            command.Parameters.AddWithValue("$parent", ToDbValue(task.Parent));
            command.Parameters.AddWithValue("$started", ToDbValue(task.Started));
            command.Parameters.AddWithValue("$completed", ToDbValue(task.Completed));
            command.Parameters.AddWithValue("$pomodoroPlanned", ToDbValue(task.Pomodoro?.Planned));
            command.Parameters.AddWithValue("$pomodoroActual", ToDbValue(task.Pomodoro?.Actual));
            command.Parameters.AddWithValue("$reviewFlagsJson", ToDbValue(Serialize(task.ReviewFlags)));
            command.Parameters.AddWithValue("$goal", ToDbValue(task.Goal));
            command.Parameters.AddWithValue("$tagsJson", ToDbValue(Serialize(task.Tags)));
            command.Parameters.AddWithValue("$googleUpdatedAt", ToDbValue(task.Updated));
            command.Parameters.AddWithValue("$lastPulledAt", pulledAt);
            command.Parameters.AddWithValue("$deletedAt", ToDbValue(task.Deleted ? pulledAt : null));

            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        var deletedCount = 0;
        foreach (var missingId in existingIds.Except(fetchedIds))
        {
            await using var deleteCommand = connection.CreateCommand();
            deleteCommand.Transaction = transaction;
            deleteCommand.CommandText =
                """
                UPDATE tasks
                SET deleted_at = $deletedAt,
                    last_pulled_at = $lastPulledAt
                WHERE list_name = $listName
                  AND id = $id
                  AND deleted_at IS NULL;
                """;
            deleteCommand.Parameters.AddWithValue("$deletedAt", pulledAt);
            deleteCommand.Parameters.AddWithValue("$lastPulledAt", pulledAt);
            deleteCommand.Parameters.AddWithValue("$listName", listName);
            deleteCommand.Parameters.AddWithValue("$id", missingId);

            deletedCount += await deleteCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        return new PullSyncRecord(tasks.Count, addedCount, updatedCount, deletedCount);
    }

    public async Task<int> InsertTaskHistoriesAsync(
        SqliteConnection connection,
        SqliteTransaction transaction,
        string syncHistoryId,
        string listName,
        IReadOnlyCollection<MyTask> tasks,
        string snapshotAt,
        string snapshotType,
        CancellationToken cancellationToken = default)
    {
        var insertedCount = 0;

        foreach (var task in tasks)
        {
            if (string.IsNullOrWhiteSpace(task.Id))
            {
                continue;
            }

            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText =
                """
                INSERT INTO task_histories (
                    history_id,
                    task_id,
                    list_name,
                    daily_note_key,
                    title,
                    status,
                    parent,
                    started,
                    completed,
                    pomodoro_planned,
                    pomodoro_actual,
                    review_flags_json,
                    goal,
                    tags_json,
                    snapshot_at,
                    snapshot_type,
                    sync_history_id,
                    deleted_at,
                    google_updated_at
                )
                VALUES (
                    $historyId,
                    $taskId,
                    $listName,
                    $dailyNoteKey,
                    $title,
                    $status,
                    $parent,
                    $started,
                    $completed,
                    $pomodoroPlanned,
                    $pomodoroActual,
                    $reviewFlagsJson,
                    $goal,
                    $tagsJson,
                    $snapshotAt,
                    $snapshotType,
                    $syncHistoryId,
                    $deletedAt,
                    $googleUpdatedAt
                );
                """;

            command.Parameters.AddWithValue("$historyId", Guid.NewGuid().ToString());
            command.Parameters.AddWithValue("$taskId", task.Id);
            command.Parameters.AddWithValue("$listName", listName);
            command.Parameters.AddWithValue("$dailyNoteKey", ToDbValue(ResolveDailyNoteKey(snapshotAt)));
            command.Parameters.AddWithValue("$title", task.Title);
            command.Parameters.AddWithValue("$status", task.Status);
            command.Parameters.AddWithValue("$parent", ToDbValue(task.Parent));
            command.Parameters.AddWithValue("$started", ToDbValue(task.Started));
            command.Parameters.AddWithValue("$completed", ToDbValue(task.Completed));
            command.Parameters.AddWithValue("$pomodoroPlanned", ToDbValue(task.Pomodoro?.Planned));
            command.Parameters.AddWithValue("$pomodoroActual", ToDbValue(task.Pomodoro?.Actual));
            command.Parameters.AddWithValue("$reviewFlagsJson", ToDbValue(Serialize(task.ReviewFlags)));
            command.Parameters.AddWithValue("$goal", ToDbValue(task.Goal));
            command.Parameters.AddWithValue("$tagsJson", ToDbValue(Serialize(task.Tags)));
            command.Parameters.AddWithValue("$snapshotAt", snapshotAt);
            command.Parameters.AddWithValue("$snapshotType", snapshotType);
            command.Parameters.AddWithValue("$syncHistoryId", syncHistoryId);
            command.Parameters.AddWithValue("$deletedAt", ToDbValue(task.Deleted ? snapshotAt : null));
            command.Parameters.AddWithValue("$googleUpdatedAt", ToDbValue(task.Updated));

            insertedCount += await command.ExecuteNonQueryAsync(cancellationToken);
        }

        return insertedCount;
    }

    public async Task ReplaceCurrentTasksFromPushAsync(
        SqliteConnection connection,
        SqliteTransaction transaction,
        string listName,
        IReadOnlyCollection<MyTask> tasks,
        string pushedAt,
        CancellationToken cancellationToken = default)
    {
        var existingIds = new HashSet<string>(StringComparer.Ordinal);

        await using (var existingCommand = connection.CreateCommand())
        {
            existingCommand.Transaction = transaction;
            existingCommand.CommandText = "SELECT id FROM tasks WHERE list_name = $listName;";
            existingCommand.Parameters.AddWithValue("$listName", listName);

            await using var reader = await existingCommand.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                existingIds.Add(reader.GetString(0));
            }
        }

        var fetchedIds = new HashSet<string>(StringComparer.Ordinal);

        foreach (var task in tasks)
        {
            if (string.IsNullOrWhiteSpace(task.Id))
            {
                continue;
            }

            fetchedIds.Add(task.Id);

            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText =
                """
                INSERT INTO tasks (
                    id,
                    list_name,
                    title,
                    status,
                    parent,
                    started,
                    completed,
                    pomodoro_planned,
                    pomodoro_actual,
                    review_flags_json,
                    goal,
                    tags_json,
                    google_updated_at,
                    last_pulled_at,
                    last_pushed_at,
                    deleted_at
                )
                VALUES (
                    $id,
                    $listName,
                    $title,
                    $status,
                    $parent,
                    $started,
                    $completed,
                    $pomodoroPlanned,
                    $pomodoroActual,
                    $reviewFlagsJson,
                    $goal,
                    $tagsJson,
                    $googleUpdatedAt,
                    NULL,
                    $lastPushedAt,
                    $deletedAt
                )
                ON CONFLICT(id) DO UPDATE SET
                    list_name = excluded.list_name,
                    title = excluded.title,
                    status = excluded.status,
                    parent = excluded.parent,
                    started = excluded.started,
                    completed = excluded.completed,
                    pomodoro_planned = excluded.pomodoro_planned,
                    pomodoro_actual = excluded.pomodoro_actual,
                    review_flags_json = excluded.review_flags_json,
                    goal = excluded.goal,
                    tags_json = excluded.tags_json,
                    google_updated_at = excluded.google_updated_at,
                    last_pushed_at = excluded.last_pushed_at,
                    deleted_at = excluded.deleted_at;
                """;

            command.Parameters.AddWithValue("$id", task.Id);
            command.Parameters.AddWithValue("$listName", listName);
            command.Parameters.AddWithValue("$title", task.Title);
            command.Parameters.AddWithValue("$status", task.Status);
            command.Parameters.AddWithValue("$parent", ToDbValue(task.Parent));
            command.Parameters.AddWithValue("$started", ToDbValue(task.Started));
            command.Parameters.AddWithValue("$completed", ToDbValue(task.Completed));
            command.Parameters.AddWithValue("$pomodoroPlanned", ToDbValue(task.Pomodoro?.Planned));
            command.Parameters.AddWithValue("$pomodoroActual", ToDbValue(task.Pomodoro?.Actual));
            command.Parameters.AddWithValue("$reviewFlagsJson", ToDbValue(Serialize(task.ReviewFlags)));
            command.Parameters.AddWithValue("$goal", ToDbValue(task.Goal));
            command.Parameters.AddWithValue("$tagsJson", ToDbValue(Serialize(task.Tags)));
            command.Parameters.AddWithValue("$googleUpdatedAt", ToDbValue(task.Updated));
            command.Parameters.AddWithValue("$lastPushedAt", pushedAt);
            command.Parameters.AddWithValue("$deletedAt", ToDbValue(task.Deleted ? pushedAt : null));

            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        foreach (var missingId in existingIds.Except(fetchedIds))
        {
            await using var deleteCommand = connection.CreateCommand();
            deleteCommand.Transaction = transaction;
            deleteCommand.CommandText =
                """
                UPDATE tasks
                SET deleted_at = $deletedAt,
                    last_pushed_at = $lastPushedAt
                WHERE list_name = $listName
                  AND id = $id;
                """;
            deleteCommand.Parameters.AddWithValue("$deletedAt", pushedAt);
            deleteCommand.Parameters.AddWithValue("$lastPushedAt", pushedAt);
            deleteCommand.Parameters.AddWithValue("$listName", listName);
            deleteCommand.Parameters.AddWithValue("$id", missingId);

            await deleteCommand.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private static object ToDbValue(object? value) => value ?? DBNull.Value;

    private static string? Serialize<T>(IEnumerable<T>? values)
    {
        return values == null ? null : JsonSerializer.Serialize(values);
    }

    private static string? ResolveDailyNoteKey(string snapshotAt)
    {
        return ToLocalDateKey(snapshotAt);
    }

    private static string? ToLocalDateKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var normalized = raw.EndsWith("Z", StringComparison.OrdinalIgnoreCase)
            || raw.Contains("+", StringComparison.Ordinal)
            ? raw
            : raw + "Z";

        if (!DateTimeOffset.TryParse(normalized, out var parsed))
        {
            return null;
        }

        return parsed.ToLocalTime().ToString("yyyy-MM-dd");
    }
}

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
            command.Parameters.AddWithValue("$goal", DBNull.Value);
            command.Parameters.AddWithValue("$tagsJson", DBNull.Value);
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

    private static object ToDbValue(object? value) => value ?? DBNull.Value;

    private static string? Serialize<T>(IEnumerable<T>? values)
    {
        return values == null ? null : JsonSerializer.Serialize(values);
    }
}

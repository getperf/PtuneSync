using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using PtuneSync.Infrastructure;
using PtuneSync.Infrastructure.Sqlite;
using PtuneSync.Models;
using PtuneSync.Protocol;

namespace PtuneSync.Services;

public sealed class ReviewQueryService
{
    private readonly DatabaseRuntimeFactory _databaseRuntimeFactory;

    public ReviewQueryService()
        : this(new DatabaseRuntimeFactory())
    {
    }

    public ReviewQueryService(DatabaseRuntimeFactory databaseRuntimeFactory)
    {
        _databaseRuntimeFactory = databaseRuntimeFactory;
    }

    public async Task<ReviewQueryResult> ExecuteAsync(RunRequestFile request, CancellationToken cancellationToken = default)
    {
        var listName = string.IsNullOrWhiteSpace(request.Args?.List)
            ? GoogleTasks.GoogleTasksAPI.DefaultTodayListName
            : request.Args.List;
        var dailyNoteKey = ResolveDailyNoteKey(request.Args);
        var exportedAt = DateTimeOffset.UtcNow.ToString("O");

        var runtime = await _databaseRuntimeFactory.CreateForVaultAsync(request.Home, cancellationToken);
        await using var connection = await runtime.OpenConnectionAsync(cancellationToken);

        var snapshot = await FindLatestSnapshotAsync(connection, listName, dailyNoteKey, cancellationToken);
        if (snapshot == null)
        {
            return new ReviewQueryResult(
                dailyNoteKey,
                listName,
                exportedAt,
                null,
                null,
                Array.Empty<MyTask>());
        }

        var tasks = await LoadSnapshotTasksAsync(connection, snapshot.SyncHistoryId, cancellationToken);
        return new ReviewQueryResult(
            dailyNoteKey,
            listName,
            exportedAt,
            snapshot.SyncHistoryId,
            snapshot.SnapshotAt,
            tasks);
    }

    private static async Task<ReviewSnapshotRef?> FindLatestSnapshotAsync(
        SqliteConnection connection,
        string listName,
        string dailyNoteKey,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT th.sync_history_id, MAX(th.snapshot_at) AS snapshot_at
            FROM task_histories th
            INNER JOIN sync_histories sh
                ON sh.id = th.sync_history_id
            WHERE th.list_name = $listName
              AND th.daily_note_key = $dailyNoteKey
              AND sh.command = 'pull'
              AND sh.status = 'success'
            GROUP BY th.sync_history_id
            ORDER BY snapshot_at DESC
            LIMIT 1;
            """;
        command.Parameters.AddWithValue("$listName", listName);
        command.Parameters.AddWithValue("$dailyNoteKey", dailyNoteKey);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new ReviewSnapshotRef(
            reader.GetString(0),
            reader.IsDBNull(1) ? null : reader.GetString(1));
    }

    private static async Task<IReadOnlyList<MyTask>> LoadSnapshotTasksAsync(
        SqliteConnection connection,
        string syncHistoryId,
        CancellationToken cancellationToken)
    {
        var tasks = new List<MyTask>();

        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT
                task_id,
                title,
                status,
                parent,
                started,
                completed,
                pomodoro_planned,
                pomodoro_actual,
                review_flags_json,
                google_updated_at,
                deleted_at
            FROM task_histories
            WHERE sync_history_id = $syncHistoryId
            ORDER BY
                CASE WHEN completed IS NULL OR completed = '' THEN 0 ELSE 1 END,
                completed,
                title;
            """;
        command.Parameters.AddWithValue("$syncHistoryId", syncHistoryId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            tasks.Add(new MyTask
            {
                Id = reader.GetString(0),
                Title = reader.GetString(1),
                Status = reader.GetString(2),
                Parent = reader.IsDBNull(3) ? null : reader.GetString(3),
                Started = reader.IsDBNull(4) ? null : reader.GetString(4),
                Completed = reader.IsDBNull(5) ? null : reader.GetString(5),
                Pomodoro = ReadPomodoro(reader),
                ReviewFlags = ReadReviewFlags(reader, 8),
                Updated = reader.IsDBNull(9) ? null : reader.GetString(9),
                Deleted = !reader.IsDBNull(10),
            });
        }

        return tasks;
    }

    private static PomodoroInfo? ReadPomodoro(SqliteDataReader reader)
    {
        var hasPlanned = !reader.IsDBNull(6);
        var hasActual = !reader.IsDBNull(7);
        if (!hasPlanned && !hasActual)
        {
            return null;
        }

        return new PomodoroInfo(
            hasPlanned ? reader.GetInt32(6) : 0,
            hasActual ? reader.GetDouble(7) : null);
    }

    private static HashSet<string>? ReadReviewFlags(SqliteDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        try
        {
            var flags = JsonSerializer.Deserialize<HashSet<string>>(reader.GetString(ordinal));
            return flags is { Count: > 0 } ? flags : null;
        }
        catch
        {
            return null;
        }
    }

    private static string ResolveDailyNoteKey(RunRequestArgs? args)
    {
        var requestedDate = args?.Date;
        if (!string.IsNullOrWhiteSpace(requestedDate))
        {
            return requestedDate;
        }

        return DateTimeOffset.Now.ToString("yyyy-MM-dd");
    }

    private sealed record ReviewSnapshotRef(string SyncHistoryId, string? SnapshotAt);
}

public sealed record ReviewQueryResult(
    string Date,
    string ListName,
    string ExportedAt,
    string? SyncHistoryId,
    string? SnapshotAt,
    IReadOnlyList<MyTask> Tasks);

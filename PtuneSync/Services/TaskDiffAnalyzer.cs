using System;
using System.Collections.Generic;
using System.Linq;
using PtuneSync.Models;

namespace PtuneSync.Services;

public static class TaskDiffAnalyzer
{
    public static DiffCommandResult Analyze(
        IReadOnlyCollection<MyTask> localTasks,
        IReadOnlyCollection<MyTask> remoteTasks)
    {
        var remoteById = remoteTasks
            .Where(static task => IsGoogleId(task.Id))
            .GroupBy(static task => task.Id, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.Ordinal);

        var toCreate = 0;
        var toUpdate = 0;
        var toDelete = 0;
        var errors = new List<string>();
        var warnings = new List<string>();

        foreach (var localTask in localTasks)
        {
            if (!IsGoogleId(localTask.Id))
            {
                toCreate++;
                continue;
            }

            if (!remoteById.TryGetValue(localTask.Id, out var remoteTask))
            {
                errors.Add($"Remote task missing: {localTask.Id}");
                continue;
            }

            if (IsCompleted(remoteTask) && !IsCompleted(localTask))
            {
                warnings.Add($"Skip reopen completed task: {localTask.Title} ({localTask.Id})");
                continue;
            }

            if (!HasSameContent(localTask, remoteTask))
            {
                toUpdate++;
            }
        }

        var localGoogleIds = localTasks
            .Where(static task => IsGoogleId(task.Id))
            .Select(static task => task.Id)
            .ToHashSet(StringComparer.Ordinal);

        foreach (var remoteTask in remoteTasks)
        {
            if (IsGoogleId(remoteTask.Id) && !localGoogleIds.Contains(remoteTask.Id))
            {
                toDelete++;
            }
        }

        return new DiffCommandResult(
            new DiffSummary(
                toCreate,
                toUpdate,
                toDelete,
                errors.Count,
                warnings.Count),
            errors,
            warnings);
    }

    private static bool IsGoogleId(string? id)
    {
        return !string.IsNullOrWhiteSpace(id)
            && !id.StartsWith("tmp_", StringComparison.OrdinalIgnoreCase)
            && !id.StartsWith("local_", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCompleted(MyTask task)
    {
        return string.Equals(task.Status, "completed", StringComparison.OrdinalIgnoreCase)
            || !string.IsNullOrWhiteSpace(task.Completed);
    }

    private static bool HasSameContent(MyTask left, MyTask right)
    {
        return string.Equals(left.Title, right.Title, StringComparison.Ordinal)
            && string.Equals(left.Status, right.Status, StringComparison.OrdinalIgnoreCase)
            && string.Equals(left.Parent, right.Parent, StringComparison.Ordinal)
            && string.Equals(left.Due, right.Due, StringComparison.Ordinal)
            && string.Equals(left.Started, right.Started, StringComparison.Ordinal)
            && string.Equals(left.Completed, right.Completed, StringComparison.Ordinal)
            && string.Equals(left.Note ?? string.Empty, right.Note ?? string.Empty, StringComparison.Ordinal)
            && Equals(left.Pomodoro?.Planned, right.Pomodoro?.Planned)
            && Equals(left.Pomodoro?.Actual, right.Pomodoro?.Actual)
            && SetEquals(left.ReviewFlags, right.ReviewFlags);
    }

    private static bool SetEquals(
        IReadOnlyCollection<string>? left,
        IReadOnlyCollection<string>? right)
    {
        if (left == null || left.Count == 0)
        {
            return right == null || right.Count == 0;
        }

        if (right == null || right.Count != left.Count)
        {
            return false;
        }

        return left.ToHashSet(StringComparer.Ordinal).SetEquals(right);
    }
}

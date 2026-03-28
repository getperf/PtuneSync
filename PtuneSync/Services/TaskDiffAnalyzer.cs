using System;
using System.Collections.Generic;
using System.Linq;
using PtuneSync.Models;

namespace PtuneSync.Services;

public static class TaskDiffAnalyzer
{
    public static bool IsGoogleIdForExternalUse(string? id) => IsGoogleId(id);

    public static TaskDiffPlan BuildPlan(
        IReadOnlyCollection<MyTask> localTasks,
        IReadOnlyCollection<MyTask> remoteTasks)
    {
        var remoteById = remoteTasks
            .Where(static task => IsGoogleId(task.Id))
            .GroupBy(static task => task.Id, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.Ordinal);

        var toCreate = new List<MyTask>();
        var toUpdate = new List<MyTask>();
        var toDelete = new List<MyTask>();
        var errors = new List<string>();
        var warnings = new List<string>();
        var matchedRemoteIds = new HashSet<string>(StringComparer.Ordinal);

        foreach (var localTask in localTasks)
        {
            if (string.IsNullOrWhiteSpace(localTask.Id))
            {
                toCreate.Add(localTask);
                continue;
            }

            if (!remoteById.TryGetValue(localTask.Id, out var remoteTask))
            {
                // ptune-task keeps local task keys when a task has not yet been
                // synchronized to Google Tasks. Those keys can look opaque, so
                // absence on remote is treated as create rather than hard error.
                toCreate.Add(localTask);
                continue;
            }

            matchedRemoteIds.Add(localTask.Id);

            if (IsCompleted(remoteTask) && !IsCompleted(localTask))
            {
                warnings.Add($"Skip reopen completed task: {localTask.Title} ({localTask.Id})");
                continue;
            }

            if (!HasSameContent(localTask, remoteTask))
            {
                toUpdate.Add(localTask);
            }
        }

        foreach (var remoteTask in remoteTasks)
        {
            if (IsGoogleId(remoteTask.Id) && !matchedRemoteIds.Contains(remoteTask.Id))
            {
                toDelete.Add(remoteTask);
            }
        }

        return new TaskDiffPlan(toCreate, toUpdate, toDelete, errors, warnings);
    }

    public static DiffCommandResult Analyze(
        IReadOnlyCollection<MyTask> localTasks,
        IReadOnlyCollection<MyTask> remoteTasks)
    {
        return BuildPlan(localTasks, remoteTasks).ToCommandResult();
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
            && string.Equals(left.Goal ?? string.Empty, right.Goal ?? string.Empty, StringComparison.Ordinal)
            && Equals(left.Pomodoro?.Planned, right.Pomodoro?.Planned)
            && Equals(left.Pomodoro?.Actual, right.Pomodoro?.Actual)
            && SetEquals(left.ReviewFlags, right.ReviewFlags)
            && SetEquals(left.Tags, right.Tags);
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

public sealed record TaskDiffPlan(
    IReadOnlyList<MyTask> ToCreate,
    IReadOnlyList<MyTask> ToUpdate,
    IReadOnlyList<MyTask> ToDelete,
    IReadOnlyList<string> Errors,
    IReadOnlyList<string> Warnings)
{
    public DiffCommandResult ToCommandResult()
    {
        return new DiffCommandResult(
            new DiffSummary(
                ToCreate.Count,
                ToUpdate.Count,
                ToDelete.Count,
                Errors.Count,
                Warnings.Count),
            Errors,
            Warnings);
    }
}

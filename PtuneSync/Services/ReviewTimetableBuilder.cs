using System;
using System.Collections.Generic;
using System.Linq;
using PtuneSync.Infrastructure;
using PtuneSync.Models;

namespace PtuneSync.Services;

public sealed class ReviewTimetableBuilder
{
    public ReviewTimetableDocument Build(ReviewQueryResult result)
    {
        if (result.Tasks.Count == 0)
        {
            return new ReviewTimetableDocument(
                $"対象日: {result.Date}",
                AppStrings.ReviewReportNoData,
                Array.Empty<ReviewTimetableRow>(),
                $"## タイムテーブル ({result.Date}){Environment.NewLine}{Environment.NewLine}{AppStrings.ReviewReportNoData}");
        }

        var rows = BuildRows(result.Tasks);

        return new ReviewTimetableDocument(
            BuildSummary(result),
            result.Tasks.Count > 0 ? $"件数: {result.Tasks.Count}" : AppStrings.ReviewReportNoData,
            rows,
            BuildMarkdown(result.Date, rows));
    }

    private static string BuildSummary(ReviewQueryResult result)
    {
        var snapshotText = string.IsNullOrWhiteSpace(result.SnapshotAt)
            ? "-"
            : FormatDateTime(result.SnapshotAt);
        return $"対象日: {result.Date}  スナップショット: {snapshotText}  件数: {result.Tasks.Count}";
    }

    private static IReadOnlyList<ReviewTimetableRow> BuildRows(IReadOnlyList<MyTask> tasks)
    {
        var existingIds = tasks
            .Where(static task => !string.IsNullOrWhiteSpace(task.Id))
            .Select(static task => task.Id)
            .ToHashSet(StringComparer.Ordinal);

        var childrenByParent = new Dictionary<string, List<MyTask>>(StringComparer.Ordinal);
        var roots = new List<MyTask>();

        foreach (var task in tasks)
        {
            if (string.IsNullOrWhiteSpace(task.Parent) || !existingIds.Contains(task.Parent))
            {
                roots.Add(task);
                continue;
            }

            if (!childrenByParent.TryGetValue(task.Parent, out var children))
            {
                children = new List<MyTask>();
                childrenByParent[task.Parent] = children;
            }

            children.Add(task);
        }

        var rows = new List<ReviewTimetableRow>();
        foreach (var root in roots)
        {
            AppendRows(root, 0, rows, childrenByParent);
        }

        return rows;
    }

    private static void AppendRows(
        MyTask task,
        int depth,
        ICollection<ReviewTimetableRow> rows,
        IReadOnlyDictionary<string, List<MyTask>> childrenByParent)
    {
        rows.Add(new ReviewTimetableRow(
            IsCompleted(task),
            IsCompleted(task) ? "✅" : string.Empty,
            $"{new string(' ', depth * 2)}{task.Title}",
            $"{new string(' ', depth * 2)}{task.Title}",
            FormatPomodoro(task.Pomodoro?.Planned),
            FormatPomodoro(task.Pomodoro?.Actual),
            FormatTime(task.Started),
            FormatTime(task.Completed),
            FormatRemark(task)));

        if (!string.IsNullOrWhiteSpace(task.Id)
            && childrenByParent.TryGetValue(task.Id, out var children))
        {
            foreach (var child in children)
            {
                AppendRows(child, depth + 1, rows, childrenByParent);
            }
        }
    }

    private static string BuildMarkdown(string date, IReadOnlyList<ReviewTimetableRow> rows)
    {
        var lines = new List<string>
        {
            $"## タイムテーブル ({date})",
            string.Empty,
            "| 状態 | タイトル | 計画🍅 | 実績✅ | 開始 | 完了 | 備考 |",
            "| --- | --- | --- | --- | --- | --- | --- |",
        };

        foreach (var row in rows)
        {
            lines.Add(
                $"| {EscapeCell(row.Status)} | {EscapeCell(row.MarkdownTitle)} | {EscapeCell(row.PlannedPomodoro)} | {EscapeCell(row.ActualPomodoro)} | {EscapeCell(row.Started)} | {EscapeCell(row.Completed)} | {EscapeCell(row.Remark)} |");
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static bool IsCompleted(MyTask task)
    {
        return string.Equals(task.Status, "completed", StringComparison.OrdinalIgnoreCase)
            || !string.IsNullOrWhiteSpace(task.Completed);
    }

    private static string FormatTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        if (DateTimeOffset.TryParse(value, out var dateTime))
        {
            return dateTime.ToLocalTime().ToString("HH:mm");
        }

        return value;
    }

    private static string FormatDateTime(string value)
    {
        if (DateTimeOffset.TryParse(value, out var dateTime))
        {
            return dateTime.ToLocalTime().ToString("yyyy-MM-dd HH:mm");
        }

        return value;
    }

    private static string FormatPomodoro(double? value)
    {
        if (!value.HasValue || value.Value <= 0)
        {
            return string.Empty;
        }

        return value.Value % 1 == 0
            ? value.Value.ToString("0")
            : value.Value.ToString("0.0");
    }

    private static string FormatRemark(MyTask task)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(task.Goal))
        {
            parts.Add($"Goal:{task.Goal}");
        }

        if (task.ReviewFlags is { Count: > 0 })
        {
            parts.Add($"Flags:{string.Join(",", task.ReviewFlags.OrderBy(static flag => flag, StringComparer.Ordinal))}");
        }

        return string.Join(" / ", parts);
    }

    private static string EscapeCell(string value)
    {
        return (value ?? string.Empty).Replace("|", "\\|");
    }
}

public sealed record ReviewTimetableDocument(
    string Summary,
    string StatusText,
    IReadOnlyList<ReviewTimetableRow> Rows,
    string Markdown);

public sealed record ReviewTimetableRow(
    bool IsCompleted,
    string Status,
    string DisplayTitle,
    string MarkdownTitle,
    string PlannedPomodoro,
    string ActualPomodoro,
    string Started,
    string Completed,
    string Remark);

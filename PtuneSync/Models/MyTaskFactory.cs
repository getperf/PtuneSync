using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace PtuneSync.Models;

/// <summary>
/// Google Tasks API から MyTask への変換、およびタスクデータコピーのヘルパ
/// </summary>
public static class MyTaskFactory
{
    public static MyTask FromApiData(Dictionary<string, object> task, string? taskListId = null)
    {
        string GetString(string key) => task.ContainsKey(key) ? task[key]?.ToString() ?? "" : "";
        string? GetOpt(string key) => task.ContainsKey(key) ? task[key]?.ToString() : null;

        var notes = GetOpt("notes");
        var reviewFlags = ReviewFlagNotesDecoder.Decode(notes);

        var pomodoro = ParsePomodoroInfo(notes);
        var goal = ExtractScalar("goal", notes);
        var tags = ExtractCsv("tags", notes);
        var started = ExtractTimestamp("started", notes);
        var completedApi = ParseDate(GetOpt("completed"));
        var due = ParseDate(GetOpt("due"));
        var updated = ParseDate(GetOpt("updated"));

        return new MyTask(
            id: GetString("id"),
            title: GetString("title"),
            pomodoro: (pomodoro?.Planned ?? 0) > 0 ? pomodoro : null,
            status: GetString("status") == "" ? "needsAction" : GetString("status"))
        {
            TaskListId = taskListId,
            Note = ExtractNoteBody(notes),
            ReviewFlags = reviewFlags.Count > 0 ? reviewFlags : null,
            Goal = goal,
            Tags = tags.Count > 0 ? tags : null,
            Parent = GetOpt("parent"),
            Position = GetOpt("position"),
            Due = due,
            Completed = completedApi,
            Updated = updated,
            Started = started,
            Deleted = task.ContainsKey("deleted") && task["deleted"] is bool b && b
        };
    }

    private static string? ExtractTimestamp(string key, string? note)
    {
        return ExtractScalar(key, note);
    }

    private static string? ExtractScalar(string key, string? note)
    {
        if (string.IsNullOrEmpty(note)) return null;
        foreach (var line in note.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
        {
            var match = Regex.Match(line.Trim(), $@"^{Regex.Escape(key)}=(.+)$");
            if (match.Success)
                return match.Groups[1].Value.Trim();
        }

        return null;
    }

    private static List<string> ExtractCsv(string key, string? note)
    {
        var raw = ExtractScalar(key, note);
        if (string.IsNullOrWhiteSpace(raw))
            return new List<string>();

        return raw.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Trim())
            .Where(part => part.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }

    private static string? ExtractNoteBody(string? note)
    {
        if (string.IsNullOrEmpty(note)) return null;

        var bodyLines = note
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.None)
            .Select(line => line.TrimEnd())
            .Where(line => !IsMetadataLine(line))
            .ToList();

        if (bodyLines.Count == 0)
            return null;

        var cleaned = string.Join(Environment.NewLine, bodyLines).Trim();
        return cleaned.Length == 0 ? null : cleaned;
    }

    private static PomodoroInfo? ParsePomodoroInfo(string? note)
    {
        if (string.IsNullOrEmpty(note)) return null;
        var planned = ExtractInt(note, @"^🍅planned=(\d+)$");
        var actual = ExtractFloat(note, @"^actual=([\d.]+)$");
        return new PomodoroInfo(planned ?? 0, actual);
    }

    private static int? ExtractInt(string text, string pattern)
    {
        foreach (var line in text.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
        {
            var match = Regex.Match(line.Trim(), pattern);
            if (match.Success)
                return int.Parse(match.Groups[1].Value);
        }

        return null;
    }

    private static double? ExtractFloat(string text, string pattern)
    {
        foreach (var line in text.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
        {
            var match = Regex.Match(line.Trim(), pattern);
            if (match.Success)
                return double.Parse(match.Groups[1].Value);
        }

        return null;
    }

    private static bool IsMetadataLine(string line)
    {
        var trimmed = line.Trim();
        if (trimmed.Length == 0) return false;

        return trimmed.StartsWith("🍅planned=", StringComparison.Ordinal) ||
               trimmed.StartsWith("actual=", StringComparison.Ordinal) ||
               trimmed.StartsWith("goal=", StringComparison.Ordinal) ||
               trimmed.StartsWith("tags=", StringComparison.Ordinal) ||
               trimmed.StartsWith("started=", StringComparison.Ordinal) ||
               trimmed.StartsWith("reviewFlags=", StringComparison.Ordinal);
    }

    private static string? ParseDate(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr)) return null;
        return DateTime.TryParse(dateStr, out var d)
            ? d.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            : null;
    }

    public static void CopyTaskData(MyTask source, MyTask target)
    {
        if (source == null || target == null) return;

        foreach (var prop in typeof(MyTask).GetProperties())
        {
            if (prop.Name == nameof(MyTask.Id)) continue;

            var value = prop.GetValue(source);
            if (value == null) continue;

            if (prop.Name == nameof(MyTask.Pomodoro) && value is PomodoroInfo srcPomodoro)
            {
                target.Pomodoro ??= new PomodoroInfo(0);
                if (srcPomodoro.Planned > 0)
                    target.Pomodoro.Planned = srcPomodoro.Planned;
                if (srcPomodoro.Actual.HasValue)
                    target.Pomodoro.Actual = srcPomodoro.Actual;
            }
            else
            {
                prop.SetValue(target, value);
            }
        }
    }
}

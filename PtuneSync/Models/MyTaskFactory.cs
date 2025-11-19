using System;
using System.Collections.Generic;
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
        var pomodoro = ParsePomodoroInfo(notes);
        var started = ExtractTimestamp("started", notes);
        var completedNote = ExtractTimestamp("completed", notes);
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
            Parent = GetOpt("parent"),
            Position = GetOpt("position"),
            Due = due,
            Completed = completedNote ?? completedApi,
            Updated = updated,
            Started = started,
            Deleted = task.ContainsKey("deleted") && task["deleted"] is bool b && b
        };
    }

    private static string? ExtractTimestamp(string key, string? note)
    {
        if (string.IsNullOrEmpty(note)) return null;
        var match = Regex.Match(note, $@"{key}=([^\s]+)");
        return match.Success ? match.Groups[1].Value : null;
    }

    private static string? ExtractNoteBody(string? note)
    {
        if (string.IsNullOrEmpty(note)) return null;
        var cleaned = Regex.Replace(note, @"🍅x\d+", "")
            .Replace("✅x", "✅x") // no-op but keeps consistency
            .Replace("✅x", "✅x")
            .Replace("✅x", "✅x");
        cleaned = Regex.Replace(cleaned, @"✅x[\d.]+", "");
        cleaned = Regex.Replace(cleaned, @"started=[^\s]+", "");
        cleaned = Regex.Replace(cleaned, @"completed=[^\s]+", "");
        cleaned = cleaned.Trim();
        return cleaned == "" ? null : cleaned;
    }

    private static PomodoroInfo? ParsePomodoroInfo(string? note)
    {
        if (string.IsNullOrEmpty(note)) return null;
        var planned = ExtractInt(note, @"🍅x(\d+)");
        var actual = ExtractFloat(note, @"✅x([\d.]+)");
        return new PomodoroInfo(planned ?? 0, actual);
    }

    private static int? ExtractInt(string text, string pattern)
    {
        var match = Regex.Match(text, pattern);
        return match.Success ? int.Parse(match.Groups[1].Value) : null;
    }

    private static double? ExtractFloat(string text, string pattern)
    {
        var match = Regex.Match(text, pattern);
        return match.Success ? double.Parse(match.Groups[1].Value) : null;
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

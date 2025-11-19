using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PtuneSync.Models;

/// <summary>
/// Google Tasks および Pomodoro 記録を統合するタスクモデル
/// </summary>
public class MyTask
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("tasklist_id")]
    public string? TaskListId { get; set; }

    [JsonPropertyName("note")]
    public string? Note { get; set; }

    [JsonPropertyName("parent")]
    public string? Parent { get; set; }

    [JsonPropertyName("position")]
    public string? Position { get; set; }

    [JsonPropertyName("pomodoro")]
    public PomodoroInfo? Pomodoro { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "needsAction"; // or "completed"

    [JsonPropertyName("subTasks")]
    public List<MyTask>? SubTasks { get; set; }

    [JsonPropertyName("due")]
    public string? Due { get; set; }

    [JsonPropertyName("completed")]
    public string? Completed { get; set; }

    [JsonPropertyName("updated")]
    public string? Updated { get; set; }

    [JsonPropertyName("started")]
    public string? Started { get; set; }

    [JsonPropertyName("deleted")]
    public bool Deleted { get; set; } = false;

    public MyTask() { }

    public MyTask(string id, string title, PomodoroInfo? pomodoro = null, string status = "needsAction")
    {
        Id = id;
        Title = title;
        Pomodoro = pomodoro;
        Status = status;
    }

    public override string ToString()
    {
        var statusMarker = Status == "completed" ? "[x]" : "[ ]";
        var pomodoroStr = Pomodoro != null ? $" {Pomodoro}" : string.Empty;
        var timeStr = FormatTimeRange(Started, Completed);
        return $"{statusMarker} {Title}{pomodoroStr}{timeStr}";
    }

    private string ConvertUtc(string date)
    {
        return date.EndsWith("Z") ? date : date + "Z";
    }

    private string FormatTimeRange(string? start, string? end)
    {
        if (string.IsNullOrEmpty(start) && string.IsNullOrEmpty(end)) return string.Empty;

        string ToTimeStr(DateTime d) =>
            $"{d.Hour}:{d.Minute:D2}:{d.Second:D2}";

        try
        {
            var parts = new List<string>();
            if (!string.IsNullOrEmpty(start))
                parts.Add(ToTimeStr(DateTime.Parse(ConvertUtc(start)).ToLocalTime()));
            if (!string.IsNullOrEmpty(end))
                parts.Add(ToTimeStr(DateTime.Parse(ConvertUtc(end)).ToLocalTime()));
            return " " + string.Join(" - ", parts);
        }
        catch
        {
            return string.Empty;
        }
    }

    public Dictionary<string, object> ToApiData()
    {
        var notes = new List<string>();
        if (!string.IsNullOrWhiteSpace(Note))
            notes.Add(Note);

        if (Pomodoro != null)
        {
            var tomato = $"🍅x{Pomodoro.Planned}";
            if (Pomodoro.Actual.HasValue)
                tomato += $" ✅x{Pomodoro.Actual}";
            notes.Add(tomato);
        }

        var body = new Dictionary<string, object>
        {
            ["title"] = Title,
            ["notes"] = string.Join(" ", notes).Trim(),
            ["status"] = Status
        };

        if (!string.IsNullOrEmpty(Id)) body["id"] = Id;
        if (!string.IsNullOrEmpty(Parent)) body["parent"] = Parent;
        if (!string.IsNullOrEmpty(Due)) body["due"] = Due;

        return body;
    }

    public MyTask CloneWithoutActuals()
    {
        var clone = (MyTask)MemberwiseClone();
        clone.Started = null;
        clone.Completed = null;
        if (clone.Pomodoro != null)
            clone.Pomodoro.Actual = null;
        return clone;
    }
}

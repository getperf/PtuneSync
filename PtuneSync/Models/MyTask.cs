using System;
using System.Collections.Generic;
using System.Linq;
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

    [JsonPropertyName("goal")]
    public string? Goal { get; set; }

    [JsonPropertyName("tags")]
    public List<string>? Tags { get; set; }

    [JsonPropertyName("reviewFlags")]
    public HashSet<string>? ReviewFlags { get; set; }
    
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
        var body = new Dictionary<string, object>
        {
            ["title"] = Title,
            ["notes"] = BuildNotesPayload(),
            ["status"] = Status
        };

        if (!string.IsNullOrEmpty(Id)) body["id"] = Id;
        if (!string.IsNullOrEmpty(Parent)) body["parent"] = Parent;
        if (!string.IsNullOrEmpty(Due)) body["due"] = Due;

        return body;
    }

    public string BuildNotesPayload()
    {
        var lines = new List<string>();

        if (!string.IsNullOrWhiteSpace(Note))
        {
            lines.AddRange(Note
                .Split(new[] { "\r\n", "\n" }, StringSplitOptions.None)
                .Select(line => line.TrimEnd())
                .Where(line => !string.IsNullOrWhiteSpace(line)));
        }

        if (ReviewFlags is { Count: > 0 })
        {
            var encodedFlags = ReviewFlagNotesEncoder.Encode(ReviewFlags);
            if (!string.IsNullOrWhiteSpace(encodedFlags))
                lines.Add(encodedFlags);
        }

        if (Pomodoro != null && Pomodoro.Planned > 0)
        {
            lines.Add($"🍅planned={Pomodoro.Planned}");
            if (Pomodoro.Actual.HasValue)
                lines.Add($"actual={Pomodoro.Actual}");
        }

        if (!string.IsNullOrWhiteSpace(Goal))
            lines.Add($"goal={Goal}");

        if (Tags is { Count: > 0 })
        {
            var normalizedTags = Tags
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Select(tag => tag.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();

            if (normalizedTags.Count > 0)
                lines.Add($"tags={string.Join(",", normalizedTags)}");
        }

        if (!string.IsNullOrWhiteSpace(Started))
            lines.Add($"started={Started}");

        return string.Join(Environment.NewLine, lines).Trim();
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

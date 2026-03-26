using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using PtuneSync.Models;

namespace PtuneSync.Services;

public static class TaskJsonDocumentReader
{
    public static async Task<TaskJsonDocument> ReadAsync(string taskJsonFile, CancellationToken cancellationToken = default)
    {
        var raw = await File.ReadAllTextAsync(taskJsonFile, cancellationToken);
        var document = JsonSerializer.Deserialize<TaskJsonDocument>(raw, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        });

        return document ?? new TaskJsonDocument();
    }

    public static List<MyTask> ToMyTasks(IEnumerable<TaskJsonTask> tasks)
    {
        var result = new List<MyTask>();

        foreach (var task in tasks)
        {
            result.Add(new MyTask(task.Id ?? string.Empty, task.Title ?? string.Empty, task.ToPomodoro(), task.Status ?? "needsAction")
            {
                Parent = null,
                Due = task.Due,
                Started = task.Started,
                Completed = task.Completed,
                Note = task.Note,
                ReviewFlags = task.ReviewFlags is { Count: > 0 } ? new HashSet<string>(task.ReviewFlags) : null,
            });
        }

        return result;
    }
}

public sealed class TaskJsonDocument
{
    [JsonPropertyName("schema_version")]
    public int? SchemaVersion { get; set; }

    [JsonPropertyName("tasks")]
    public List<TaskJsonTask> Tasks { get; set; } = new();
}

public sealed class TaskJsonTask
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("parent")]
    public string? Parent { get; set; }

    [JsonPropertyName("parent_key")]
    public string? ParentKey { get; set; }

    public string? EffectiveParentKey()
    {
        return !string.IsNullOrWhiteSpace(ParentKey) ? ParentKey : Parent;
    }

    [JsonPropertyName("pomodoro_planned")]
    public int? PomodoroPlanned { get; set; }

    [JsonPropertyName("pomodoro_actual")]
    public double? PomodoroActual { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("started")]
    public string? Started { get; set; }

    [JsonPropertyName("completed")]
    public string? Completed { get; set; }

    [JsonPropertyName("due")]
    public string? Due { get; set; }

    [JsonPropertyName("note")]
    public string? Note { get; set; }

    [JsonPropertyName("review_flags")]
    public List<string>? ReviewFlags { get; set; }

    public PomodoroInfo? ToPomodoro()
    {
        if (PomodoroPlanned is null && PomodoroActual is null)
        {
            return null;
        }

        return new PomodoroInfo(PomodoroPlanned ?? 0, PomodoroActual);
    }
}

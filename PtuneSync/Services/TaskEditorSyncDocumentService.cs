using PtuneSync.Infrastructure;
using PtuneSync.Models;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PtuneSync.Services;

public sealed class TaskEditorSyncDocumentService
{
    public async Task<string> WriteTaskJsonAsync(
        IEnumerable<TaskItem> tasks,
        CancellationToken cancellationToken = default)
    {
        var document = new TaskJsonDocument
        {
            SchemaVersion = 2,
            Tasks = BuildTasks(tasks).ToList(),
        };

        var workDir = WorkDirInitializer.EnsureWorkDir();
        var path = Path.Combine(workDir, "gui-sync-tasks.json");
        var json = JsonSerializer.Serialize(document, new JsonSerializerOptions
        {
            WriteIndented = true,
        });

        await File.WriteAllTextAsync(path, json, cancellationToken);
        return path;
    }

    private static IEnumerable<TaskJsonTask> BuildTasks(IEnumerable<TaskItem> tasks)
    {
        string? currentParentTitle = null;
        var localIdCounter = 0;

        foreach (var task in tasks)
        {
            if (string.IsNullOrWhiteSpace(task.Title))
            {
                continue;
            }

            var normalizedTitle = task.Title.Trim();
            var taskId = !string.IsNullOrWhiteSpace(task.RemoteId)
                ? task.RemoteId
                : $"tmp_gui_{++localIdCounter}";
            var parentKey = task.IsChild ? currentParentTitle : null;
            if (!task.IsChild)
            {
                currentParentTitle = normalizedTitle;
            }

            var selectedTags = task.GetSelectedTags();

            yield return new TaskJsonTask
            {
                Id = taskId,
                Title = normalizedTitle,
                Parent = task.RemoteParentId,
                ParentKey = parentKey,
                PomodoroPlanned = task.PlannedPomodoroCount > 0 ? task.PlannedPomodoroCount : null,
                Status = string.IsNullOrWhiteSpace(task.Status) ? "needsAction" : task.Status,
                Started = task.Started,
                Completed = task.Completed,
                Due = task.Due,
                Goal = string.IsNullOrWhiteSpace(task.Goal) ? null : task.Goal,
                Tags = selectedTags.Count > 0 ? selectedTags.ToList() : null,
            };
        }
    }
}

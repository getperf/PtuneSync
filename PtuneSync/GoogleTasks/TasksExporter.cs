using PtuneSync.Infrastructure;
using PtuneSync.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PtuneSync.GoogleTasks;

public class TasksExporter
{
    private readonly GoogleTasksAPI _api;
    private readonly string _listName;

    public TasksExporter(GoogleTasksAPI api, string listName = GoogleTasksAPI.DefaultTodayListName)
    {
        _api = api;
        _listName = listName;
    }

    public async Task ExportAsync(IEnumerable<ParsedTask> parsed)
    {
        AppLog.Info("[TasksExporter] Export start for list '{0}'", _listName);
        var list = await _api.EnsureTaskListAsync(_listName);
        var listId = list.Id ?? throw new InvalidOperationException("List ID missing");

        var existing = await _api.ListTasksAsync(listId);
        if (existing.Count > 0)
            throw new InvalidOperationException("Target list already contains tasks.");

        var parentMap = new Dictionary<int, string>();

        // 親タスク
        foreach (var parent in parsed.Where(p => !p.ParentIndex.HasValue))
        {
            var myTask = ToMyTask(parent);
            var created = await _api.AddTaskAsync(myTask, listId);
            parentMap[parent.Index] = created.Id!;
            AppLog.Debug("[TasksExporter] Created parent: {0}", parent.Title);
        }

        // 子タスク
        foreach (var child in parsed.Where(p => p.ParentIndex.HasValue))
        {
            var myTask = ToMyTask(child);
            var created = await _api.AddTaskAsync(myTask, listId);
            var parentId = parentMap[child.ParentIndex!.Value];
            await _api.MoveTaskAsync(created.Id!, listId, parentId);
            AppLog.Debug("[TasksExporter] Moved child '{0}' under '{1}'", child.Title, parentId);
        }

        AppLog.Info("[TasksExporter] Export complete.");
    }

    /// <summary>
    /// ParsedTask → MyTask 変換
    /// </summary>
    private static MyTask ToMyTask(ParsedTask parsed)
    {
        var pomodoro = parsed.Pomodoro > 0 ? new PomodoroInfo(parsed.Pomodoro) : null;
        return new MyTask(
            id: "",
            title: parsed.Title,
            pomodoro: pomodoro,
            status: "needsAction"
        );
    }
}
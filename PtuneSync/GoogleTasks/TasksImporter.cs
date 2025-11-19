using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;

namespace PtuneSync.GoogleTasks;

public class TasksImporter
{
    private readonly GoogleTasksAPI _api;

    public TasksImporter(GoogleTasksAPI api)
    {
        _api = api;
    }

    /// <summary>
    /// 指定されたリスト名のタスクを取得
    /// </summary>
    public async Task<List<MyTask>> FetchTasksAsync(string listName)
    {
        AppLog.Debug("[TasksImporter] Fetch start: {0}", listName);

        var list = await _api.EnsureTaskListAsync(listName);
        var tasks = await _api.ListTasksAsync(list.Id!);

        AppLog.Info("[TasksImporter] Retrieved {0} tasks from {1}", tasks.Count, listName);
        return tasks;
    }

    /// <summary>
    /// タスク一覧を JSON ファイルに保存
    /// </summary>
    public async Task SaveAsJsonAsync(List<MyTask> tasks, string path)
    {
        try
        {
            var json = JsonSerializer.Serialize(tasks, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            await File.WriteAllTextAsync(path, json);
            AppLog.Info("[TasksImporter] Saved JSON to {0}", path);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[TasksImporter] Failed to save JSON");
            throw;
        }
    }
}

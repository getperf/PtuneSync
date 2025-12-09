using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;

namespace PtuneSync.GoogleTasks;

public class TasksReset
{
    private readonly GoogleTasksAPI _api;
    private readonly string _taskListName;

    public TasksReset(GoogleTasksAPI api, string taskListName)
    {
        _api = api;
        _taskListName = taskListName;
    }
    public async Task RunAsync()
    {
        AppLog.Debug("[TasksReset] start list={0}", _taskListName);

        var list = await _api.EnsureTaskListAsync(_taskListName);
        var listId = list.Id!;
        var tasks = await _api.ListTasksAsync(listId);

        AppLog.Info("[TasksReset] existing count={0}", tasks.Count);
        foreach (var t in tasks)
        {
            await _api.DeleteTaskAsync(t.Id!, listId);
            AppLog.Debug("[TasksReset] deleted: {0} ({1})", t.Title, t.Id);
        }

        // 削除反映待ち（最大5回）
        for (int i = 0; i < 5; i++)
        {
            await Task.Delay(1000);
            var remain = await _api.ListTasksAsync(listId);
            if (remain.Count == 0)
            {
                AppLog.Info("[TasksReset] confirmed empty");
                return;
            }
            AppLog.Debug("[TasksReset] waiting delete propagation... remain={0}", remain.Count);
        }

        AppLog.Warn("[TasksReset] timeout waiting for delete propagation");
    }
}

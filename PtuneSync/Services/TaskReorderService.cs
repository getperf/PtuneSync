using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PtuneSync.GoogleTasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;

namespace PtuneSync.Services;

public sealed class TaskReorderService
{
    private readonly GoogleTasksAPI _api;

    public TaskReorderService(GoogleTasksAPI api)
    {
        _api = api;
    }

    public async Task ReorderAsync(
        string listId,
        IReadOnlyList<MyTask> localTasks,
        IReadOnlyList<MyTask> remoteTasks)
    {
        AppLog.Debug("[TaskReorderService] reorder start listId={0}", listId);

        var localMap = TaskOrderBuilder.BuildAsIs(localTasks);
        var remoteMap = TaskOrderBuilder.BuildRemoteNormalized(remoteTasks);
        var allParents = localMap.Keys.Concat(remoteMap.Keys).Distinct(StringComparer.Ordinal).ToList();

        foreach (var parentId in allParents)
        {
            var localIds = ExtractIds(localMap.TryGetValue(parentId, out var localGroup) ? localGroup : null);
            var remoteIds = ExtractIds(remoteMap.TryGetValue(parentId, out var remoteGroup) ? remoteGroup : null);

            AppLog.Debug(
                "[TaskReorderService] parent={0} local=[{1}] remote=[{2}]",
                parentId == TaskTreeOrderService.RootParentKey ? "<root>" : parentId,
                string.Join(",", localIds),
                string.Join(",", remoteIds));

            if (localIds.SequenceEqual(remoteIds))
            {
                continue;
            }

            if (localGroup is null)
            {
                continue;
            }

            foreach (var task in Enumerable.Reverse(localGroup))
            {
                if (string.IsNullOrWhiteSpace(task.Id))
                {
                    continue;
                }

                var effectiveParentId = parentId == TaskTreeOrderService.RootParentKey ? null : parentId;
                await _api.MoveTaskAsync(task.Id, listId, effectiveParentId, previousId: null);
            }
        }

        AppLog.Debug("[TaskReorderService] reorder end");
    }

    private static List<string> ExtractIds(List<MyTask>? tasks)
    {
        return tasks?.Where(static task => !string.IsNullOrWhiteSpace(task.Id))
            .Select(static task => task.Id)
            .ToList()
            ?? new List<string>();
    }

}

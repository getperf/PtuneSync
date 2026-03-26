using System;
using System.Collections.Generic;
using PtuneSync.Models;

namespace PtuneSync.Services;

public static class TaskOrderBuilder
{
    public static Dictionary<string, List<MyTask>> BuildAsIs(IEnumerable<MyTask> tasks)
    {
        var orderMap = new Dictionary<string, List<MyTask>>(StringComparer.Ordinal);

        foreach (var task in tasks)
        {
            var parentKey = TaskTreeOrderService.NormalizeParentKey(task.Parent);
            if (!orderMap.TryGetValue(parentKey, out var siblings))
            {
                siblings = new List<MyTask>();
                orderMap[parentKey] = siblings;
            }

            siblings.Add(task);
        }

        return orderMap;
    }

    public static Dictionary<string, List<MyTask>> BuildRemoteNormalized(IEnumerable<MyTask> tasks)
    {
        return BuildAsIs(TaskTreeOrderService.Rebuild(tasks));
    }
}

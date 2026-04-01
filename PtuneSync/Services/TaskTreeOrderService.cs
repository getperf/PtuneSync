using System;
using System.Collections.Generic;
using System.Linq;
using PtuneSync.Models;

namespace PtuneSync.Services;

public static class TaskTreeOrderService
{
    public const string RootParentKey = "";

    public static List<MyTask> Rebuild(IEnumerable<MyTask> tasks)
    {
        var sorted = tasks
            .OrderBy(static task => task.Position ?? string.Empty, StringComparer.Ordinal)
            .ToList();

        var parentMap = new Dictionary<string, List<MyTask>>(StringComparer.Ordinal);

        foreach (var task in sorted)
        {
            var parentKey = NormalizeParentKey(task.Parent);
            if (!parentMap.TryGetValue(parentKey, out var children))
            {
                children = new List<MyTask>();
                parentMap[parentKey] = children;
            }

            children.Add(task);
        }

        var ordered = new List<MyTask>();

        void Walk(string parentId)
        {
            if (!parentMap.TryGetValue(parentId, out var children))
            {
                return;
            }

            foreach (var child in children)
            {
                ordered.Add(child);
                Walk(child.Id);
            }
        }

        Walk(RootParentKey);
        return ordered;
    }

    public static string NormalizeParentKey(string? parent)
    {
        return string.IsNullOrWhiteSpace(parent) ? RootParentKey : parent;
    }
}

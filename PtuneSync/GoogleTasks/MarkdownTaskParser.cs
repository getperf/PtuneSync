using System.Text.RegularExpressions;
using PtuneSync.Models;
using PtuneSync.Infrastructure;
using System.Collections.Generic;
using System.Linq;

namespace PtuneSync.GoogleTasks;

public static class MarkdownTaskParser
{
    private static readonly Regex TaskRe = new(@"^\s*-\s\[\s\]\s+(.*?)(?:\s*🍅x?(\d+))?$");

    public static List<ParsedTask> Parse(IEnumerable<string> lines)
    {
        var result = new List<ParsedTask>();
        int? currentParent = null;
        int index = 0;

        foreach (var line in lines)
        {
            var m = TaskRe.Match(line);
            if (!m.Success) continue;

            var title = m.Groups[1].Value.Trim();
            if (string.IsNullOrEmpty(title)) continue;

            int.TryParse(m.Groups[2].Value, out int pomo);
            int indent = line.TakeWhile(char.IsWhiteSpace).Count();

            var task = new ParsedTask
            {
                Index = index++,
                Title = title,
                Pomodoro = pomo,
                RawLine = line
            };

            if (indent > 0 && currentParent.HasValue)
                task.ParentIndex = currentParent.Value;
            else
                currentParent = task.Index;

            result.Add(task);
        }

        AppLog.Debug("[MarkdownTaskParser] Parsed {0} tasks", result.Count);
        return result.AsEnumerable().Reverse().ToList();
    }
}

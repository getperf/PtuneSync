using System.Collections.Generic;
using System.Text;
using PtuneSync.Models;

namespace PtuneSync.Services
{
    public static class MarkdownTaskBuilder
    {
        /// <summary>
        /// TaskItem の一覧から Markdown を生成する
        /// </summary>
        public static string Build(IEnumerable<TaskItem> tasks)
        {
            var sb = new StringBuilder();

            foreach (var t in tasks)
            {
                if (string.IsNullOrEmpty(t.Title))
                    continue;

                // インデント：子タスクなら Tab
                string indent = t.IsChild ? "\t" : "";

                // Pomodoro ラベルは "" または "🍅xN"
                string pomo = t.PomodoroLabel;

                // Markdown 行生成
                sb.Append(indent);
                sb.Append("- [ ] ");
                sb.Append(t.Title);

                if (!string.IsNullOrEmpty(pomo))
                    sb.Append(pomo);

                sb.AppendLine();
            }

            return sb.ToString();
        }
    }
}

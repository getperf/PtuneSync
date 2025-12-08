// File: Services/ExportService.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;

namespace PtuneSync.Services;

public class ExportService
{
    public async Task<bool> ExecuteAsync(IEnumerable<TaskItem> tasks)
    {
        AppLog.Info("[ExportService] Start");

        // 1) Markdown 生成
        var markdown = MarkdownTaskBuilder.Build(tasks);

        // 2) WorkDir に保存
        var path = WorkDirInitializer.WriteMarkdown(markdown);

        AppLog.Info("[ExportService] Markdown written → {0}", path);

        // 3) プロトコルハンドラ（今はスケルトン）
        await Task.Delay(200);
        AppLog.Info("[ExportService] (SKIP) Protocol export not implemented");

        return true;
    }
}

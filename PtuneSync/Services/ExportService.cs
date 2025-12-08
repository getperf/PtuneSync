// File: Services/ExportService.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;

namespace PtuneSync.Services;

public class ExportService
{
    public async Task<ProtocolLauncher.ProtocolLaunchResult> ExecuteAsync(
        IEnumerable<TaskItem> tasks)
    {
        AppLog.Info("[ExportService] Start");

        // 1) WorkDir 準備
        var workDir = WorkDirInitializer.EnsureWorkDir();

        // 2) Markdown 生成
        var markdown = MarkdownTaskBuilder.Build(tasks);

        // 3) Markdown 保存
        var path = WorkDirInitializer.WriteMarkdown(markdown);
        AppLog.Info("[ExportService] Markdown written → {0}", path);

        // 4) プロトコル /export URI 構築
        var vaultHome = AppPaths.VaultHome;
        var uri = AppUriBuilder.BuildExport(vaultHome);

        // 5) ProtocolLauncher を使って起動 & status.json を監視
        var launcher = new ProtocolLauncher(vaultHome);
        var result = await launcher.LaunchAndWaitAsync(uri, "export");

        AppLog.Info("[ExportService] Result: {0}", result.Success);
        return result;
    }
}

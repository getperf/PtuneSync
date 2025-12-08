// File: Services/ExportService.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;

namespace PtuneSync.Services;

public class ExportService
{
    private readonly UserDialogService _dialog = new();

    public async Task<ProtocolLauncher.ProtocolLaunchResult> ExecuteAsync(
        IEnumerable<TaskItem> tasks)
    {
        AppLog.Info("[ExportService] Start");

        // --- 事前確認 ---
        bool ok = await _dialog.ConfirmAsync(
            "Google Tasks の既存項目は削除され、新しいタスクに置き換えられます。\n続行しますか？",
            "エクスポート確認");

        if (!ok)
        {
            AppLog.Info("[ExportService] canceled by user");
            return new ProtocolLauncher.ProtocolLaunchResult
            {
                Success = false,
                Message = "キャンセルされました"
            };
        }

        // 1) WorkDir 準備
        var workDir = WorkDirInitializer.EnsureWorkDir();

        // 2) Markdown 生成
        var markdown = MarkdownTaskBuilder.Build(tasks);

        // 3) Markdown 保存
        var path = WorkDirInitializer.WriteMarkdown(markdown);
        AppLog.Info("[ExportService] Markdown written → {0}", path);

        // 4) プロトコル /export URI
        var vaultHome = AppPaths.VaultHome;
        var uri = AppUriBuilder.BuildExport(vaultHome);

        // 5) プロトコル実行
        var launcher = new ProtocolLauncher(vaultHome);
        var result = await launcher.LaunchAndWaitAsync(uri, "export");

        AppLog.Info("[ExportService] Result: {0}", result.Success);

        // --- ★ 完了通知ダイアログ追加 ---
        if (result.Success)
        {
            await _dialog.ShowMessageAsync(
                "Google Tasks へのエクスポートが完了しました。",
                "エクスポート成功");
        }
        else
        {
            await _dialog.ShowMessageAsync(
                $"エクスポートに失敗しました。\n{result.Message}",
                "エクスポート失敗");
        }

        return result;
    }
}

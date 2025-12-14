using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

/// <summary>
/// get-tasks-md プロトコル用ハンドラー
/// - アプリ LocalStateRoot/vault_home/.obsidian/plugins/ptune-log/work/tasks.md を読み込み
/// - status.json の message に内容をコピー
/// </summary>
public sealed class GetTasksMarkdownHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.GetTasksMarkdown);

        // プロトコル上の vault_home は status.json の出力先識別子としてのみ使用
        var vaultHomeParam = request.Get("vault_home");
        if (string.IsNullOrEmpty(vaultHomeParam))
        {
            AppLog.Warn("[GetTasksMarkdownHandler] Missing vault_home");
            return;
        }

        try
        {
            // GUI 版では LocalStateRoot/vault_home を実体の vault として扱う
            var localVaultHome = AppPaths.VaultHome;

            var workDir = AppPaths.WorkDir(localVaultHome);
            Directory.CreateDirectory(workDir);

            var tasksPath = Path.Combine(workDir, "tasks.md");
            AppLog.Info("[GetTasksMarkdownHandler] Read tasks.md: {0}", tasksPath);

            if (!File.Exists(tasksPath))
            {
                await StatusFileService.Write(
                    vaultHomeParam,
                    "get-tasks-md",
                    "tasks.md not found",
                    "error"
                );
                return;
            }

            var markdown = await File.ReadAllTextAsync(tasksPath);

            await StatusFileService.Write(
                vaultHomeParam,
                "get-tasks-md",
                markdown
            );

            AppLog.Info("[GetTasksMarkdownHandler] get-tasks-md completed");
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[GetTasksMarkdownHandler] get-tasks-md failed");
            await StatusFileService.Write(
                vaultHomeParam,
                "get-tasks-md",
                ex.Message,
                "error"
            );
        }
        finally
        {
            ActivationSessionManager.End(SessionNames.GetTasksMarkdown);
        }
    }
}

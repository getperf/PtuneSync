using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.GoogleTasks;
using PtuneSync.Infrastructure;
using PtuneSync.OAuth;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public class ImportHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.Import);

        var vaultHome = request.Get("vault_home");
        var outputFile = request.Get("output") ?? "import_tasks.json";
        var listName = request.Get("tasklist") ?? GoogleTasksAPI.DefaultTodayListName;

        if (string.IsNullOrEmpty(vaultHome))
        {
            AppLog.Warn("[ImportHandler] Missing vault_home");
            return;
        }

        var workDir = Path.Combine(vaultHome, ".obsidian", "plugins", "ptune-log", "work");
        var outputPath = Path.Combine(workDir, outputFile);
        Directory.CreateDirectory(workDir);

        try
        {
            AppLog.Info("[ImportHandler] Start import: list={0}, output={1}", listName, outputFile);

            var config = AppConfigManager.Config.GoogleOAuth;
            var oauthManager = new OAuthManager(config, workDir);
            var api = new GoogleTasksAPI(oauthManager);

            await StatusFileService.Write(vaultHome, "import", "Start", "start");
            var importer = new TasksImporter(api);
            var tasks = await importer.FetchTasksAsync(listName);

            await importer.SaveAsJsonAsync(tasks, outputPath);

            await StatusFileService.Write(vaultHome, "import", $"タスクを {tasks.Count} 件エクスポートしました");
            AppLog.Info("[ImportHandler] Import completed: {0} tasks saved.", tasks.Count);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[ImportHandler] Import failed");
            await StatusFileService.Write(vaultHome, "import", ex.Message, "error");
        }
        finally
        {
            ActivationSessionManager.End(SessionNames.Import);
        }

    }
}

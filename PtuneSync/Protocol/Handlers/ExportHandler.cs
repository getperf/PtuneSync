using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.GoogleTasks;
using PtuneSync.Infrastructure;
using PtuneSync.OAuth;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public class ExportHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.Import);

        var vaultHome = request.Get("vault_home");
        var listName = request.Get("tasklist") ?? GoogleTasksAPI.DefaultTodayListName;

        if (string.IsNullOrEmpty(vaultHome))
        {
            AppLog.Warn("[ExportHandler] Missing vault_home");
            return;
        }

        var inputFile = request.Get("input") ?? "tasks.md";
        var workDir = Path.Combine(vaultHome, ".obsidian", "plugins", "ptune-log", "work");
        var inputPath = Path.Combine(workDir, inputFile);

        AppLog.Debug("[ExportHandler] Input file: {0}", inputPath);

        try
        {
            if (!File.Exists(inputPath))
                throw new FileNotFoundException("Input file not found", inputPath);

            var lines = await File.ReadAllLinesAsync(inputPath);
            var parsed = MarkdownTaskParser.Parse(lines);

            var config = AppConfigManager.Config.GoogleOAuth;
            var oauth = new OAuthManager(config, workDir);
            var api = new GoogleTasksAPI(oauth);

            await StatusFileService.Write(vaultHome, "export", "Start", "start");
            AppLog.Debug("[ExportHandler] ensure list");
            var list = await api.EnsureTaskListAsync(listName);

            AppLog.Debug("[ExportHandler] list id={0} → reset", list.Id);
            var reset = new TasksReset(api, listName);
            await reset.RunAsync();
            await StatusFileService.Write(vaultHome, "export", "Task Resetted", "working");

            var exporter = new TasksExporter(api);
            await exporter.ExportAsync(parsed);
            await StatusFileService.Write(vaultHome, "export", "Task export completed");

            AppLog.Info("[ExportHandler] Export finished successfully");
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[ExportHandler] Export failed");
            await StatusFileService.Write(vaultHome ?? "unknown", "export", ex.Message, "error");
        }
        finally
        {
            ActivationSessionManager.End(SessionNames.Import);
		}
    }
}

using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.GoogleTasks;
using PtuneSync.Infrastructure;
using PtuneSync.OAuth;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers
{
    /// <summary>
    /// Export → Import を連続実行する統合ハンドラ
    /// </summary>
    public class ExportImportHandler : IProtocolHandler
    {
        public async Task ExecuteAsync(ProtocolRequest request)
        {
            ActivationSessionManager.Begin(SessionNames.Import);

            var vaultHome = request.Get("vault_home");
            var listName = request.Get("tasklist") ?? GoogleTasksAPI.DefaultTodayListName;

            if (string.IsNullOrEmpty(vaultHome))
            {
                AppLog.Warn("[ExportImportHandler] Missing vault_home");
                ActivationSessionManager.End(SessionNames.Import);
                return;
            }

            try
            {
                AppLog.Info("[ExportImportHandler] Start sync: list={0}", listName);

                // --- 1. Export ---
                AppLog.Info("[ExportImportHandler] Run Export");
                var exportHandler = new ExportHandler();
                await exportHandler.ExecuteAsync(request);
                await Task.Delay(1000);

                // --- 2. Import ---
                AppLog.Info("[ExportImportHandler] Run Import");
                var importHandler = new ImportHandler();
                await importHandler.ExecuteAsync(request);

                await StatusFileService.Write(
                    vaultHome, "sync", "Export + Import completed", "done"
                );

                AppLog.Info("[ExportImportHandler] Sync completed successfully");
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[ExportImportHandler] Sync failed");
                await StatusFileService.Write(vaultHome, "sync", ex.Message, "error");
            }
            finally
            {
                ActivationSessionManager.End(SessionNames.Import);
            }
        }
    }
}

using System;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public class LaunchHandler : IProtocolHandler
{
    private const string Op = "launch";

    public async Task ExecuteAsync(ProtocolRequest request)
    {
        var vaultHome = request.Get("vault_home");
        if (string.IsNullOrEmpty(vaultHome))
        {
            AppLog.Warn("[LaunchHandler] Missing vault_home in {Op}", Op);
            return;
        }

        try
        {
            AppLog.Info("[LaunchHandler] Launching with vault_home={Vault}", vaultHome);

            // 実際の起動処理をここに追加
            await StatusFileService.Write(vaultHome, Op, $"[{Op}] completed");

            AppLog.Debug("[LaunchHandler] LaunchHandler complete");
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[LaunchHandler] LaunchHandler failed");
            await StatusFileService.Write(vaultHome!, Op, $"[{Op}] failed", "error");
        }
    }
}

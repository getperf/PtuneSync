using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.OAuth;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public class AuthHandler : IProtocolHandler
{
    private const string Op = "auth";
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        AppLog.Info("[AuthHandler] Start");
        ActivationSessionManager.Begin(SessionNames.Auth);

        var vaultHome = request.Get("vault_home");
        if (string.IsNullOrEmpty(vaultHome))
        {
            AppLog.Warn("[LaunchHandler] Missing vault_home in {Op}", Op);
            return;
        }
        var workDir = Path.Combine(vaultHome, ".obsidian", "plugins", "ptune-log", "work");

        try
        {
            await StatusFileService.Write(vaultHome, "auth", "Start", "start");
            var config = AppConfigManager.Config.GoogleOAuth;
            var manager = new OAuthManager(config, workDir);
            var token = await manager.GetOrRefreshAsync();
            await StatusFileService.Write(vaultHome, Op, $"[{Op}] completed");
            await StatusFileService.Write(vaultHome, "auth", "Google OAuth completed");

            AppLog.Info("[AuthHandler] Access token: {0}", token.AccessToken[..20]);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[AuthHandler] Failed to get token");
            await StatusFileService.Write(vaultHome!, Op, $"[{Op}] failed", "error");
        }
        finally
        {
            ActivationSessionManager.End(SessionNames.Auth);
		}
    }
}

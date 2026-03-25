using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.OAuth;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunAuthLoginHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        var requestFile = request.Get("request_file");
        if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
        {
            AppLog.Warn("[RunAuthLoginHandler] request_file missing: {0}", requestFile ?? "<null>");
            return;
        }

        RunRequestFile? runRequest;
        try
        {
            var raw = await File.ReadAllTextAsync(requestFile);
            runRequest = JsonSerializer.Deserialize<RunRequestFile>(raw);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunAuthLoginHandler] Failed to read request.json: {0}", requestFile);
            return;
        }

        if (runRequest == null || string.IsNullOrWhiteSpace(runRequest.RequestId) || string.IsNullOrWhiteSpace(runRequest.StatusFile))
        {
            AppLog.Warn("[RunAuthLoginHandler] Invalid request payload: {0}", requestFile);
            return;
        }

        const string command = "auth-login";

        await RunStatusFileService.WriteAsync(
            runRequest.StatusFile,
            runRequest.RequestId,
            command,
            phase: "accepted",
            status: "running",
            message: "dispatcher accepted request");

        try
        {
            var tokenWorkDir = ResolveTokenWorkDir(runRequest.Home);
            AppConfigManager.RememberVaultHome(runRequest.Home);
            AppLog.Info("[RunAuthLoginHandler] home={Home} tokenWorkDir={TokenWorkDir}", runRequest.Home, tokenWorkDir);

            await RunStatusFileService.WriteAsync(
                runRequest.StatusFile,
                runRequest.RequestId,
                command,
                phase: "running",
                status: "running",
                message: "browser login started");

            var config = AppConfigManager.Config.GoogleOAuth;
            var storage = new TokenStorage(tokenWorkDir);
            storage.Delete();

            var manager = new OAuthManager(config, tokenWorkDir);
            var token = await manager.GetOrRefreshAsync();
            var authenticated = token.ExpiresAt > DateTime.Now;

            await RunStatusFileService.WriteAsync(
                runRequest.StatusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "success",
                message: "auth-login completed",
                data: new
                {
                    auth = new
                    {
                        authenticated,
                        expires_at = token.ExpiresAt.ToString("O"),
                    }
                });
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunAuthLoginHandler] auth-login failed");
            await RunStatusFileService.WriteAsync(
                runRequest.StatusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "error",
                message: "auth-login failed",
                error: new
                {
                    type = "OAUTH_ERROR",
                    message = ex.Message,
                });
        }
    }

    private static string ResolveTokenWorkDir(string? home)
    {
        if (!string.IsNullOrWhiteSpace(home))
        {
            var normalizedHome = Path.GetFullPath(home);
            var authDir = Path.Combine(normalizedHome, "auth");
            Directory.CreateDirectory(authDir);
            return authDir;
        }

        AppLog.Warn("[RunAuthLoginHandler] home missing. Falling back to legacy token path.");
        return AppPaths.WorkDir(AppPaths.VaultHome);
    }
}

using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.OAuth;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunAuthStatusHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        var requestFile = request.Get("request_file");
        if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
        {
            AppLog.Warn("[RunAuthStatusHandler] request_file missing: {0}", requestFile ?? "<null>");
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
            AppLog.Error(ex, "[RunAuthStatusHandler] Failed to read request.json: {0}", requestFile);
            return;
        }

        if (runRequest == null || string.IsNullOrWhiteSpace(runRequest.RequestId) || string.IsNullOrWhiteSpace(runRequest.StatusFile))
        {
            AppLog.Warn("[RunAuthStatusHandler] Invalid request payload: {0}", requestFile);
            return;
        }

        const string command = "auth-status";

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
            AppLog.Info("[RunAuthStatusHandler] home={Home} tokenWorkDir={TokenWorkDir}", runRequest.Home, tokenWorkDir);

            var storage = new TokenStorage(tokenWorkDir);
            var token = storage.Load();
            var authenticated = token != null && token.ExpiresAt > DateTime.Now;

            await RunStatusFileService.WriteAsync(
                runRequest.StatusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "success",
                message: "auth-status completed",
                data: new
                {
                    auth = new
                    {
                        authenticated,
                        expires_at = token?.ExpiresAt.ToString("O"),
                    }
                });
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunAuthStatusHandler] auth-status failed");
            await RunStatusFileService.WriteAsync(
                runRequest.StatusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "error",
                message: "auth-status failed",
                error: new
                {
                    type = "SYSTEM_ERROR",
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
            var authTokenFile = Path.Combine(authDir, "token.json");
            var homeTokenFile = Path.Combine(normalizedHome, "token.json");

            if (Directory.Exists(authDir) || File.Exists(authTokenFile))
                return authDir;

            if (File.Exists(homeTokenFile))
                return normalizedHome;

            return authDir;
        }

        AppLog.Warn("[RunAuthStatusHandler] home missing. Falling back to legacy token path.");
        return AppPaths.WorkDir(AppPaths.VaultHome);
    }
}

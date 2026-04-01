using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.OAuth;
using PtuneSync.Infrastructure;
using PtuneSync.Infrastructure.Auth;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunAuthLoginHandler : IProtocolHandler
{
    private static readonly TimeSpan AuthLoginTimeout = TimeSpan.FromSeconds(90);

    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.RunAuthLogin);

        var requestFile = request.Get("request_file");
        try
        {
            if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
            {
                AppLog.Warn("[RunAuthLoginHandler] request_file missing: {0}", requestFile ?? "<null>");
                return;
            }

            RunRequestFile? runRequest;
            try
            {
                runRequest = await RunRequestFileReader.ReadAsync(requestFile);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunAuthLoginHandler] Failed to read request.json: {0}", requestFile);
                return;
            }

            if (!RunRequestFileReader.IsValid(runRequest))
            {
                AppLog.Warn("[RunAuthLoginHandler] Invalid request payload: {0}", requestFile);
                return;
            }

            var statusFile = runRequest!.ResolveStatusFile()!;
            var requestIdentity = runRequest.ResolveRequestIdentity();
            var requestNonce = runRequest.ResolveRequestNonce();
            var requestId = runRequest.ResolveLegacyRequestId();
            const string command = "auth-login";

            await RunStatusFileService.WriteAsync(
                statusFile,
                requestIdentity,
                command,
                phase: "accepted",
                status: "running",
                message: "dispatcher accepted request",
                requestNonce: requestNonce,
                requestId: requestId);

            try
            {
                var tokenWorkDir = TokenWorkDirResolver.Resolve(runRequest.Home, "RunAuthLoginHandler");
                var profileKey = ProfilePathResolver.ResolveProfileKey(runRequest.Home);
                AppConfigManager.RememberVaultHome(runRequest.Home);
                AppLog.Info("[RunAuthLoginHandler] home={Home} tokenWorkDir={TokenWorkDir} profileKey={ProfileKey}", runRequest.Home, tokenWorkDir, profileKey);

                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
                    command,
                    phase: "running",
                    status: "running",
                    message: "browser login started",
                    requestNonce: requestNonce,
                    requestId: requestId);

                var config = AppConfigManager.Config.GoogleOAuth;
                var storage = new TokenStorage(tokenWorkDir);
                storage.Delete();

                var sessionStore = new AuthSessionStore();
                await sessionStore.CleanupExpiredAsync(profileKey, TimeSpan.FromDays(1));
                var manager = new OAuthManager(config, tokenWorkDir, profileKey, requestNonce);
                var authTask = manager.GetOrRefreshAsync();
                var completedTask = await Task.WhenAny(authTask, Task.Delay(AuthLoginTimeout));
                if (completedTask != authTask)
                {
                    throw new TimeoutException("auth-login timed out while waiting for browser authentication");
                }

                var token = await authTask;
                var authenticated = token.ExpiresAt > DateTime.Now;

                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
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
                    },
                    requestNonce: requestNonce,
                    requestId: requestId);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunAuthLoginHandler] auth-login failed");
                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
                    command,
                    phase: "completed",
                    status: "error",
                    message: "auth-login failed",
                    error: new
                        {
                            type = "OAUTH_ERROR",
                            message = ex.Message,
                        },
                        requestNonce: requestNonce,
                        requestId: requestId);
            }
        }
        finally
        {
            ActivationSessionManager.End(SessionNames.RunAuthLogin);
        }
    }
}

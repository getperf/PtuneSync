using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunAuthLoginHandler : IProtocolHandler
{
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
                AppConfigManager.RememberVaultHome(runRequest.Home);
                AppLog.Info("[RunAuthLoginHandler] home={Home} tokenWorkDir={TokenWorkDir}", runRequest.Home, tokenWorkDir);

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
                var storage = new OAuth.TokenStorage(tokenWorkDir);
                storage.Delete();

                var manager = new OAuth.OAuthManager(config, tokenWorkDir);
                var token = await manager.GetOrRefreshAsync();
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

using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunAuthStatusHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.RunAuthStatus);

        var requestFile = request.Get("request_file");
        try
        {
            if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
            {
                AppLog.Warn("[RunAuthStatusHandler] request_file missing: {0}", requestFile ?? "<null>");
                return;
            }

            RunRequestFile? runRequest;
            try
            {
                runRequest = await RunRequestFileReader.ReadAsync(requestFile);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunAuthStatusHandler] Failed to read request.json: {0}", requestFile);
                return;
            }

            if (!RunRequestFileReader.IsValid(runRequest))
            {
                AppLog.Warn("[RunAuthStatusHandler] Invalid request payload: {0}", requestFile);
                return;
            }

            var statusFile = runRequest!.ResolveStatusFile()!;
            var requestIdentity = runRequest.ResolveRequestIdentity();
            var requestNonce = runRequest.ResolveRequestNonce();
            var requestId = runRequest.ResolveLegacyRequestId();
            const string command = "auth-status";

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
                var tokenWorkDir = TokenWorkDirResolver.Resolve(runRequest.Home, "RunAuthStatusHandler");
                AppConfigManager.RememberVaultHome(runRequest.Home);
                AppLog.Info("[RunAuthStatusHandler] home={Home} tokenWorkDir={TokenWorkDir}", runRequest.Home, tokenWorkDir);

                var storage = new OAuth.TokenStorage(tokenWorkDir);
                var token = storage.Load();
                var authenticated = token != null && token.ExpiresAt > DateTime.Now;

                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
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
                    },
                    requestNonce: requestNonce,
                    requestId: requestId);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunAuthStatusHandler] auth-status failed");
                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
                    command,
                    phase: "completed",
                    status: "error",
                    message: "auth-status failed",
                    error: new
                        {
                            type = "SYSTEM_ERROR",
                            message = ex.Message,
                        },
                        requestNonce: requestNonce,
                        requestId: requestId);
            }
        }
        finally
        {
            ActivationSessionManager.End(SessionNames.RunAuthStatus);
        }
    }
}

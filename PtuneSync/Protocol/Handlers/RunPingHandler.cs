using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunPingHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.RunPing);

        var requestFile = request.Get("request_file");
        try
        {
            if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
            {
                AppLog.Warn("[RunPingHandler] request_file missing: {0}", requestFile ?? "<null>");
                return;
            }

            RunRequestFile? runRequest;
            try
            {
                runRequest = await RunRequestFileReader.ReadAsync(requestFile);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunPingHandler] Failed to read request.json: {0}", requestFile);
                return;
            }

            if (!RunRequestFileReader.IsValid(runRequest))
            {
                AppLog.Warn("[RunPingHandler] Invalid request payload: {0}", requestFile);
                return;
            }

            var statusFile = runRequest!.ResolveStatusFile()!;
            var requestIdentity = runRequest.ResolveRequestIdentity();
            var requestNonce = runRequest.ResolveRequestNonce();
            var requestId = runRequest.ResolveLegacyRequestId();
            const string command = "ping";

            await RunStatusFileService.WriteAsync(
                statusFile,
                requestIdentity,
                command,
                phase: "accepted",
                status: "running",
                message: "dispatcher accepted request",
                requestNonce: requestNonce,
                requestId: requestId);

            await RunStatusFileService.WriteAsync(
                statusFile,
                requestIdentity,
                command,
                phase: "completed",
                status: "success",
                message: "ping completed",
                data: new
                {
                    received_at = DateTimeOffset.UtcNow.ToString("O"),
                    pid = Environment.ProcessId,
                    process_name = Process.GetCurrentProcess().ProcessName,
                },
                requestNonce: requestNonce,
                requestId: requestId);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunPingHandler] ping failed");
        }
        finally
        {
            ActivationSessionManager.End(SessionNames.RunPing);
        }
    }
}

using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunLaunchHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.RunLaunch);

        var requestFile = request.Get("request_file");
        try
        {
            if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
            {
                AppLog.Warn("[RunLaunchHandler] request_file missing: {0}", requestFile ?? "<null>");
                return;
            }

            RunRequestFile? runRequest;
            try
            {
                runRequest = await RunRequestFileReader.ReadAsync(requestFile);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunLaunchHandler] Failed to read request.json: {0}", requestFile);
                return;
            }

            if (!RunRequestFileReader.IsValid(runRequest))
            {
                AppLog.Warn("[RunLaunchHandler] Invalid request payload: {0}", requestFile);
                return;
            }

            var statusFile = runRequest!.ResolveStatusFile()!;
            var requestIdentity = runRequest.ResolveRequestIdentity();
            var requestNonce = runRequest.ResolveRequestNonce();
            var requestId = runRequest.ResolveLegacyRequestId();
            const string command = "launch";

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
                message: "launch completed",
                data: new
                {
                    mode = "resident-test",
                    pid = Environment.ProcessId,
                    process_name = Process.GetCurrentProcess().ProcessName,
                    activated_at = DateTimeOffset.UtcNow.ToString("O"),
                },
                requestNonce: requestNonce,
                requestId: requestId);

            AppLog.Info("[RunLaunchHandler] launch completed; keeping process alive for diagnostics. pid={Pid}", Environment.ProcessId);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunLaunchHandler] launch failed");
        }
    }
}

using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunPushHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        var requestFile = request.Get("request_file");
        if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
        {
            AppLog.Warn("[RunPushHandler] request_file missing: {0}", requestFile ?? "<null>");
            return;
        }

        RunRequestFile? runRequest;
        try
        {
            runRequest = await RunRequestFileReader.ReadAsync(requestFile);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunPushHandler] Failed to read request.json: {0}", requestFile);
            return;
        }

        if (!RunRequestFileReader.IsValid(runRequest))
        {
            AppLog.Warn("[RunPushHandler] Invalid request payload: {0}", requestFile);
            return;
        }

        var statusFile = runRequest!.ResolveStatusFile()!;
        const string command = "push";

        await RunStatusFileService.WriteAsync(
            statusFile,
            runRequest.RequestId,
            command,
            phase: "accepted",
            status: "running",
            message: "dispatcher accepted request");

        try
        {
            await RunStatusFileService.WriteAsync(
                statusFile,
                runRequest.RequestId,
                command,
                phase: "running",
                status: "running",
                message: "push started");

            var service = new PushCommandService();
            var result = await service.ExecuteAsync(runRequest);

            await RunStatusFileService.WriteAsync(
                statusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "success",
                message: "push completed",
                data: new
                {
                    summary = new
                    {
                        accepted = result.SyncRecord.AcceptedCount,
                        added = result.SyncRecord.AddedCount,
                        updated = result.SyncRecord.UpdatedCount,
                        deleted = result.SyncRecord.DeletedCount,
                        errors = result.DiffResult.Errors.Count,
                        warnings = result.DiffResult.Warnings.Count,
                    },
                    errors = result.DiffResult.Errors,
                    warnings = result.DiffResult.Warnings,
                });
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunPushHandler] push failed");
            await RunStatusFileService.WriteAsync(
                statusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "error",
                message: "push failed",
                error: new
                {
                    type = "SYSTEM_ERROR",
                    message = ex.Message,
                });
        }
    }
}

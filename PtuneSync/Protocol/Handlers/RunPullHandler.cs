using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunPullHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        var requestFile = request.Get("request_file");
        if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
        {
            AppLog.Warn("[RunPullHandler] request_file missing: {0}", requestFile ?? "<null>");
            return;
        }

        RunRequestFile? runRequest;
        try
        {
            runRequest = await RunRequestFileReader.ReadAsync(requestFile);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunPullHandler] Failed to read request.json: {0}", requestFile);
            return;
        }

        if (!RunRequestFileReader.IsValid(runRequest))
        {
            AppLog.Warn("[RunPullHandler] Invalid request payload: {0}", requestFile);
            return;
        }

        var statusFile = runRequest!.ResolveStatusFile()!;
        const string command = "pull";

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
                message: "pull started");

            var service = new PullCommandService();
            var result = await service.ExecuteAsync(runRequest);

            await RunStatusFileService.WriteAsync(
                statusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "success",
                message: "pull completed",
                data: new
                {
                    schema_version = 2,
                    list = result.ListName,
                    include_completed = result.IncludeCompleted,
                    exported_at = result.ExportedAt,
                    tasks = result.ResponseTasks,
                    meta = new
                    {
                        task_count = result.ResponseTasks.Count,
                        fetched_count = result.TotalFetchedCount,
                        backup_file = result.BackupFile,
                        accepted_count = result.SyncRecord.AcceptedCount,
                        added_count = result.SyncRecord.AddedCount,
                        updated_count = result.SyncRecord.UpdatedCount,
                        deleted_count = result.SyncRecord.DeletedCount,
                    },
                });
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunPullHandler] pull failed");
            await RunStatusFileService.WriteAsync(
                statusFile,
                runRequest.RequestId,
                command,
                phase: "completed",
                status: "error",
                message: "pull failed",
                error: new
                {
                    type = "SYSTEM_ERROR",
                    message = ex.Message,
                });
        }
    }
}

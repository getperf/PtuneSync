using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunReviewHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        ActivationSessionManager.Begin(SessionNames.RunReview);

        var requestFile = request.Get("request_file");
        try
        {
            if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
            {
                AppLog.Warn("[RunReviewHandler] request_file missing: {0}", requestFile ?? "<null>");
                return;
            }

            RunRequestFile? runRequest;
            try
            {
                runRequest = await RunRequestFileReader.ReadAsync(requestFile);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunReviewHandler] Failed to read request.json: {0}", requestFile);
                return;
            }

            if (!RunRequestFileReader.IsValid(runRequest))
            {
                AppLog.Warn("[RunReviewHandler] Invalid request payload: {0}", requestFile);
                return;
            }

            var statusFile = runRequest!.ResolveStatusFile()!;
            var requestIdentity = runRequest.ResolveRequestIdentity();
            var requestNonce = runRequest.ResolveRequestNonce();
            var requestId = runRequest.ResolveLegacyRequestId();
            const string command = "review";

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
                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
                    command,
                    phase: "running",
                    status: "running",
                    message: "review started",
                    requestNonce: requestNonce,
                    requestId: requestId);

                var service = new ReviewQueryService();
                var result = await service.ExecuteAsync(runRequest);

                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
                    command,
                    phase: "completed",
                    status: "success",
                    message: "review completed",
                    data: new
                    {
                        date = result.Date,
                        list = result.ListName,
                        exported_at = result.ExportedAt,
                        tasks = result.Tasks,
                        meta = new
                        {
                            task_count = result.Tasks.Count,
                            sync_history_id = result.SyncHistoryId,
                            snapshot_at = result.SnapshotAt,
                            source = "local_db",
                        },
                    },
                    requestNonce: requestNonce,
                    requestId: requestId);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[RunReviewHandler] review failed");
                await RunStatusFileService.WriteAsync(
                    statusFile,
                    requestIdentity,
                    command,
                    phase: "completed",
                    status: "error",
                    message: "review failed",
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
            ActivationSessionManager.End(SessionNames.RunReview);
        }
    }
}

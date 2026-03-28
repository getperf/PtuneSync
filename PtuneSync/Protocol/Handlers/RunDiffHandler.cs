using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Services;

namespace PtuneSync.Protocol.Handlers;

public sealed class RunDiffHandler : IProtocolHandler
{
    public async Task ExecuteAsync(ProtocolRequest request)
    {
        var requestFile = request.Get("request_file");
        if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
        {
            AppLog.Warn("[RunDiffHandler] request_file missing: {0}", requestFile ?? "<null>");
            return;
        }

        RunRequestFile? runRequest;
        try
        {
            runRequest = await RunRequestFileReader.ReadAsync(requestFile);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunDiffHandler] Failed to read request.json: {0}", requestFile);
            return;
        }

        if (!RunRequestFileReader.IsValid(runRequest))
        {
            AppLog.Warn("[RunDiffHandler] Invalid request payload: {0}", requestFile);
            return;
        }

        var statusFile = runRequest!.ResolveStatusFile()!;
        var requestIdentity = runRequest.ResolveRequestIdentity();
        var requestNonce = runRequest.ResolveRequestNonce();
        var requestId = runRequest.ResolveLegacyRequestId();
        const string command = "diff";

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
                message: "diff started",
                requestNonce: requestNonce,
                requestId: requestId);

            var service = new DiffCommandService();
            var result = await service.ExecuteAsync(runRequest);

            await RunStatusFileService.WriteAsync(
                statusFile,
                requestIdentity,
                command,
                phase: "completed",
                status: "success",
                message: "diff completed",
                data: new
                {
                    summary = new
                    {
                        create = result.Summary.Create,
                        update = result.Summary.Update,
                        delete = result.Summary.Delete,
                        errors = result.Summary.Errors,
                        warnings = result.Summary.Warnings,
                    },
                    errors = result.Errors,
                    warnings = result.Warnings,
                },
                requestNonce: requestNonce,
                requestId: requestId);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunDiffHandler] diff failed");
            await RunStatusFileService.WriteAsync(
                statusFile,
                requestIdentity,
                command,
                phase: "completed",
                status: "error",
                message: "diff failed",
                error: new
                    {
                        type = "SYSTEM_ERROR",
                        message = ex.Message,
                    },
                    requestNonce: requestNonce,
                    requestId: requestId);
        }
    }
}

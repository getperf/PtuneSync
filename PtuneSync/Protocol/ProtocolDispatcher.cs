using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.Protocol;

public static class ProtocolDispatcher
{
    private static readonly ConcurrentDictionary<string, byte> _activeRunKeys = new();

    private static readonly Dictionary<string, IProtocolHandler> _handlers = new()
    {
        { "launch", new Handlers.LaunchHandler() },
        { "export", new Handlers.ExportHandler() },
        { "import", new Handlers.ImportHandler() },
        { "get-tasks-md", new Handlers.GetTasksMarkdownHandler() },
        { "auth", new Handlers.AuthHandler() },
        { "run/auth/status", new Handlers.RunAuthStatusHandler() },
        { "run/auth/login", new Handlers.RunAuthLoginHandler() },
        { "run/pull", new Handlers.RunPullHandler() },
        { "run/diff", new Handlers.RunDiffHandler() },
        { "run/push", new Handlers.RunPushHandler() },
    };

    public static async Task Dispatch(Uri uri)
    {
        var request = new ProtocolRequest(uri);
        AppLog.Info("[ProtocolDispatcher] Protocol Activated: {Uri}", uri);

        if (_handlers.TryGetValue(request.Command, out var handler))
        {
            if (TryGetRunDispatchGuard(request, out var runKey, out var completedOrActiveMessage))
            {
                if (!string.IsNullOrWhiteSpace(completedOrActiveMessage))
                {
                    var guardedRunKey = runKey ?? "<unknown>";
                    AppLog.Info("[ProtocolDispatcher] Skip duplicate run. command={Command} key={RunKey} reason={Reason}",
                        request.Command,
                        guardedRunKey,
                        completedOrActiveMessage);
                    return;
                }

                if (!_activeRunKeys.TryAdd(runKey!, 0))
                {
                    var guardedRunKey = runKey ?? "<unknown>";
                    AppLog.Info("[ProtocolDispatcher] Skip in-memory duplicate run. command={Command} key={RunKey}",
                        request.Command,
                        guardedRunKey);
                    return;
                }
            }

            try
            {
                await handler.ExecuteAsync(request);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[ProtocolDispatcher] Handler execution failed for {Command}", request.Command);
            }
            finally
            {
                if (!string.IsNullOrWhiteSpace(runKey))
                {
                    _activeRunKeys.TryRemove(runKey, out _);
                }
            }
        }
        else
        {
            AppLog.Warn("[ProtocolDispatcher] Unknown command: {Command}, Uri={Uri}", request.Command, uri);
        }
    }

    private static bool TryGetRunDispatchGuard(
        ProtocolRequest request,
        out string? runKey,
        out string? completedOrActiveMessage)
    {
        runKey = null;
        completedOrActiveMessage = null;

        if (!request.Command.StartsWith("run/", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var requestFile = request.Get("request_file");
        if (string.IsNullOrWhiteSpace(requestFile))
        {
            AppLog.Warn("[ProtocolDispatcher] request_file missing for run command: {Command}", request.Command);
            return false;
        }

        RunRequestFile? runRequest;
        try
        {
            runRequest = RunRequestFileReader.ReadAsync(requestFile).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[ProtocolDispatcher] Failed to read request file for dispatch guard: {RequestFile}", requestFile);
            return false;
        }

        if (!RunRequestFileReader.IsValid(runRequest))
        {
            AppLog.Warn("[ProtocolDispatcher] Invalid run request for dispatch guard: {RequestFile}", requestFile);
            return false;
        }

        runKey = runRequest!.ResolveRequestIdentity();
        var statusFile = runRequest.ResolveStatusFile();
        if (string.IsNullOrWhiteSpace(statusFile))
        {
            return true;
        }

        try
        {
            var snapshot = RunStatusSnapshotReader.ReadAsync(statusFile).GetAwaiter().GetResult();
            if (snapshot == null)
            {
                return true;
            }

            if (string.Equals(snapshot.Phase, "completed", StringComparison.OrdinalIgnoreCase))
            {
                completedOrActiveMessage = "already completed";
                return true;
            }

            if (string.Equals(snapshot.Phase, "accepted", StringComparison.OrdinalIgnoreCase)
                || string.Equals(snapshot.Phase, "running", StringComparison.OrdinalIgnoreCase))
            {
                completedOrActiveMessage = $"already {snapshot.Phase.ToLowerInvariant()}";
                return true;
            }
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[ProtocolDispatcher] Failed to read status file for dispatch guard: {StatusFile}", statusFile);
        }

        return true;
    }
}

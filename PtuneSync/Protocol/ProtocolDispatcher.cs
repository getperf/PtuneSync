using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.Protocol;

public static class ProtocolDispatcher
{
    private static readonly TimeSpan AuthLoginStaleTimeout = TimeSpan.FromSeconds(90);
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
            if (await TryGetRunDispatchGuardAsync(request) is var guard && guard.Enabled)
            {
                if (!string.IsNullOrWhiteSpace(guard.CompletedOrActiveMessage))
                {
                    var guardedRunKey = guard.RunKey ?? "<unknown>";
                    AppLog.Info("[ProtocolDispatcher] Skip duplicate run. command={Command} key={RunKey} reason={Reason}",
                        request.Command,
                        guardedRunKey,
                        guard.CompletedOrActiveMessage);
                    return;
                }

                if (!_activeRunKeys.TryAdd(guard.RunKey!, 0))
                {
                    var guardedRunKey = guard.RunKey ?? "<unknown>";
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
                if (!string.IsNullOrWhiteSpace(guard.RunKey))
                {
                    _activeRunKeys.TryRemove(guard.RunKey, out _);
                }
            }
        }
        else
        {
            AppLog.Warn("[ProtocolDispatcher] Unknown command: {Command}, Uri={Uri}", request.Command, uri);
        }
    }

    private static async Task<RunDispatchGuard> TryGetRunDispatchGuardAsync(ProtocolRequest request)
    {
        if (!request.Command.StartsWith("run/", StringComparison.OrdinalIgnoreCase))
        {
            return RunDispatchGuard.Disabled;
        }

        var requestFile = request.Get("request_file");
        if (string.IsNullOrWhiteSpace(requestFile))
        {
            AppLog.Warn("[ProtocolDispatcher] request_file missing for run command: {Command}", request.Command);
            return RunDispatchGuard.Disabled;
        }

        RunRequestFile? runRequest;
        try
        {
            runRequest = await RunRequestFileReader.ReadAsync(requestFile);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[ProtocolDispatcher] Failed to read request file for dispatch guard: {RequestFile}", requestFile);
            return RunDispatchGuard.Disabled;
        }

        if (!RunRequestFileReader.IsValid(runRequest))
        {
            AppLog.Warn("[ProtocolDispatcher] Invalid run request for dispatch guard: {RequestFile}", requestFile);
            return RunDispatchGuard.Disabled;
        }

        var validRunRequest = runRequest!;
        var statusFile = validRunRequest.ResolveStatusFile();
        if (string.IsNullOrWhiteSpace(statusFile))
        {
            return RunDispatchGuard.Disabled;
        }

        var publicIdentity = validRunRequest.ResolvePublicRequestIdentity();
        if (string.IsNullOrWhiteSpace(publicIdentity))
        {
            AppLog.Warn("[ProtocolDispatcher] Missing request identity for dispatch guard: {RequestFile}", requestFile);
            return RunDispatchGuard.Disabled;
        }

        var runKey = BuildRunKey(statusFile, publicIdentity);

        try
        {
            var snapshot = await RunStatusSnapshotReader.ReadAsync(statusFile);
            if (snapshot == null)
            {
                return RunDispatchGuard.EnabledFor(runKey);
            }

            var existingIdentity = snapshot.ResolvePublicRequestIdentity();
            var isSameLogicalRequest = string.Equals(
                existingIdentity,
                publicIdentity,
                StringComparison.Ordinal);

            if (string.Equals(snapshot.Phase, "completed", StringComparison.OrdinalIgnoreCase))
            {
                if (isSameLogicalRequest)
                {
                    return RunDispatchGuard.EnabledFor(runKey, "already completed");
                }

                return RunDispatchGuard.EnabledFor(runKey);
            }

            if (string.Equals(snapshot.Phase, "accepted", StringComparison.OrdinalIgnoreCase)
                || string.Equals(snapshot.Phase, "running", StringComparison.OrdinalIgnoreCase))
            {
                if (CanRetryStaleAuthLogin(request.Command, snapshot))
                {
                    AppLog.Warn(
                        "[ProtocolDispatcher] Allow retry for stale auth-login request. command={Command} statusCommand={StatusCommand} updatedAt={UpdatedAt}",
                        request.Command,
                        snapshot.Command,
                        snapshot.UpdatedAt);
                    return RunDispatchGuard.EnabledFor(runKey);
                }

                var message = isSameLogicalRequest
                    ? $"already {snapshot.Phase.ToLowerInvariant()}"
                    : $"busy with {snapshot.Phase.ToLowerInvariant()} request";
                return RunDispatchGuard.EnabledFor(runKey, message);
            }
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[ProtocolDispatcher] Failed to read status file for dispatch guard: {StatusFile}", statusFile);
        }

        return RunDispatchGuard.EnabledFor(runKey);
    }

    private static string BuildRunKey(string statusFile, string requestIdentity)
    {
        return $"{statusFile.Trim().ToLowerInvariant()}::{requestIdentity}";
    }

    private static bool CanRetryStaleAuthLogin(string requestCommand, RunStatusSnapshot snapshot)
    {
        if (!string.Equals(requestCommand, "run/auth/login", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.Equals(snapshot.Command, "auth-login", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var updatedAt = snapshot.ResolveUpdatedAt();
        if (updatedAt == null)
        {
            return false;
        }

        return DateTimeOffset.UtcNow - updatedAt.Value >= AuthLoginStaleTimeout;
    }

    private readonly record struct RunDispatchGuard(bool Enabled, string? RunKey, string? CompletedOrActiveMessage)
    {
        public static RunDispatchGuard Disabled => new(false, null, null);

        public static RunDispatchGuard EnabledFor(string runKey, string? message = null)
        {
            return new RunDispatchGuard(true, runKey, message);
        }
    }
}

using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PtuneSync.Infrastructure.Auth;

public sealed class AuthSessionStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    private static readonly TimeSpan PollInterval = TimeSpan.FromMilliseconds(500);
    private static readonly TimeSpan Retention = TimeSpan.FromDays(1);

    public async Task<AuthSessionRecord> CreatePendingAsync(string profileKey, string? requestNonce, string state)
    {
        await CleanupExpiredAsync(profileKey, Retention);

        var now = DateTimeOffset.UtcNow.ToString("O");
        var session = new AuthSessionRecord
        {
            SessionId = BuildSessionId(),
            RequestNonce = requestNonce,
            State = state,
            Status = "pending",
            CreatedAt = now,
            UpdatedAt = now,
        };

        await WriteAsync(profileKey, session);
        return session;
    }

    public async Task<string> WaitForRedirectAsync(string profileKey, string sessionId, TimeSpan timeout)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;

        while (DateTimeOffset.UtcNow < deadline)
        {
            var session = await ReadAsync(profileKey, sessionId);
            if (session == null)
            {
                throw new InvalidOperationException("Auth session not found.");
            }

            if (string.Equals(session.Status, "redirected", StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(session.RedirectUri))
            {
                return session.RedirectUri!;
            }

            if (string.Equals(session.Status, "failed", StringComparison.OrdinalIgnoreCase)
                || string.Equals(session.Status, "expired", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(session.Error ?? "Auth session failed.");
            }

            await Task.Delay(PollInterval);
        }

        await MarkExpiredAsync(profileKey, sessionId, "Redirect timeout");
        throw new TimeoutException("Redirect timeout");
    }

    public async Task<bool> TrySetRedirectByStateAcrossProfilesAsync(string state, string redirectUri)
    {
        var profilesRoot = Path.Combine(AppPaths.LocalStateRoot, "profiles");
        if (!Directory.Exists(profilesRoot))
        {
            return false;
        }

        foreach (var profileDir in Directory.EnumerateDirectories(profilesRoot))
        {
            var profileKey = Path.GetFileName(profileDir);
            if (await TrySetRedirectByStateAsync(profileKey, state, redirectUri))
            {
                return true;
            }
        }

        return false;
    }

    public async Task<bool> TrySetRedirectByStateAsync(string profileKey, string state, string redirectUri)
    {
        var sessionsDir = GetSessionsDirectory(profileKey);
        if (!Directory.Exists(sessionsDir))
        {
            return false;
        }

        foreach (var sessionFile in Directory.EnumerateFiles(sessionsDir, "*.json"))
        {
            AuthSessionRecord? session;
            try
            {
                var raw = await File.ReadAllTextAsync(sessionFile);
                session = JsonSerializer.Deserialize<AuthSessionRecord>(raw);
            }
            catch
            {
                continue;
            }

            if (session == null
                || !string.Equals(session.State, state, StringComparison.Ordinal)
                || string.Equals(session.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            session.Status = "redirected";
            session.RedirectUri = redirectUri;
            session.Error = null;
            session.UpdatedAt = DateTimeOffset.UtcNow.ToString("O");
            await WriteAsync(profileKey, session);
            return true;
        }

        return false;
    }

    public async Task MarkCompletedAsync(string profileKey, string sessionId)
    {
        var session = await ReadAsync(profileKey, sessionId);
        if (session == null)
        {
            return;
        }

        session.Status = "completed";
        session.Error = null;
        session.UpdatedAt = DateTimeOffset.UtcNow.ToString("O");
        await WriteAsync(profileKey, session);
    }

    public async Task MarkFailedAsync(string profileKey, string sessionId, string message)
    {
        var session = await ReadAsync(profileKey, sessionId);
        if (session == null)
        {
            return;
        }

        session.Status = "failed";
        session.Error = message;
        session.UpdatedAt = DateTimeOffset.UtcNow.ToString("O");
        await WriteAsync(profileKey, session);
    }

    public async Task MarkExpiredAsync(string profileKey, string sessionId, string message)
    {
        var session = await ReadAsync(profileKey, sessionId);
        if (session == null)
        {
            return;
        }

        session.Status = "expired";
        session.Error = message;
        session.UpdatedAt = DateTimeOffset.UtcNow.ToString("O");
        await WriteAsync(profileKey, session);
    }

    public async Task CleanupExpiredAsync(string profileKey, TimeSpan retention)
    {
        var sessionsDir = GetSessionsDirectory(profileKey);
        if (!Directory.Exists(sessionsDir))
        {
            return;
        }

        foreach (var sessionFile in Directory.EnumerateFiles(sessionsDir, "*.json"))
        {
            try
            {
                var raw = await File.ReadAllTextAsync(sessionFile);
                var session = JsonSerializer.Deserialize<AuthSessionRecord>(raw);
                var updatedAt = DateTimeOffset.TryParse(session?.UpdatedAt, out var parsed)
                    ? parsed
                    : DateTimeOffset.MinValue;

                if (updatedAt == DateTimeOffset.MinValue)
                {
                    continue;
                }

                if (DateTimeOffset.UtcNow - updatedAt < retention)
                {
                    continue;
                }

                if (session != null && (
                    string.Equals(session.Status, "completed", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(session.Status, "failed", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(session.Status, "expired", StringComparison.OrdinalIgnoreCase)))
                {
                    File.Delete(sessionFile);
                }
            }
            catch
            {
                // keep best-effort cleanup silent
            }
        }
    }

    private async Task<AuthSessionRecord?> ReadAsync(string profileKey, string sessionId)
    {
        var filePath = GetSessionFilePath(profileKey, sessionId);
        if (!File.Exists(filePath))
        {
            return null;
        }

        var raw = await File.ReadAllTextAsync(filePath);
        return JsonSerializer.Deserialize<AuthSessionRecord>(raw);
    }

    private async Task WriteAsync(string profileKey, AuthSessionRecord session)
    {
        var sessionsDir = GetSessionsDirectory(profileKey);
        Directory.CreateDirectory(sessionsDir);

        var filePath = GetSessionFilePath(profileKey, session.SessionId);
        var tmpFile = filePath + ".tmp";
        var json = JsonSerializer.Serialize(session, JsonOptions);
        await File.WriteAllTextAsync(tmpFile, json, new UTF8Encoding(false));
        await FileUtils.MoveWithRetryAsync(tmpFile, filePath, overwrite: true);
    }

    private static string GetSessionsDirectory(string profileKey)
    {
        return Path.Combine(
            AppPaths.LocalStateRoot,
            "profiles",
            profileKey,
            "auth",
            "sessions");
    }

    private static string GetSessionFilePath(string profileKey, string sessionId)
    {
        return Path.Combine(GetSessionsDirectory(profileKey), $"{sessionId}.json");
    }

    private static string BuildSessionId()
    {
        var prefix = DateTimeOffset.UtcNow.ToString("yyyyMMddTHHmmssfffZ");
        var suffix = Guid.NewGuid().ToString("N")[..4];
        return $"{prefix}-{suffix}";
    }
}

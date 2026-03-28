using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;

namespace PtuneSync.Protocol;

public sealed class RunRequestFile
{
    [JsonPropertyName("schema_version")]
    public int SchemaVersion { get; set; }

    [JsonPropertyName("request_nonce")]
    public string RequestNonce { get; set; } = "";

    [JsonPropertyName("request_id")]
    public string RequestId { get; set; } = "";

    [JsonPropertyName("command")]
    public string Command { get; set; } = "";

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; } = "";

    [JsonPropertyName("home")]
    public string Home { get; set; } = "";

    [JsonPropertyName("status_file")]
    public string StatusFile { get; set; } = "";

    [JsonPropertyName("workspace")]
    public RunRequestWorkspace? Workspace { get; set; }

    [JsonPropertyName("input")]
    public RunRequestInput? Input { get; set; }

    [JsonPropertyName("args")]
    public RunRequestArgs? Args { get; set; }

    public string? ResolveStatusFile()
    {
        if (!string.IsNullOrWhiteSpace(Workspace?.StatusFile))
        {
            return Workspace.StatusFile;
        }

        return string.IsNullOrWhiteSpace(StatusFile) ? null : StatusFile;
    }

    public string? ResolveRunDir()
    {
        if (!string.IsNullOrWhiteSpace(Workspace?.RunDir))
        {
            return Workspace.RunDir;
        }

        var statusFile = ResolveStatusFile();
        return string.IsNullOrWhiteSpace(statusFile)
            ? null
            : Path.GetDirectoryName(statusFile);
    }

    public string ResolveRequestIdentity()
    {
        if (!string.IsNullOrWhiteSpace(RequestNonce))
        {
            return RequestNonce;
        }

        if (!string.IsNullOrWhiteSpace(RequestId))
        {
            return RequestId;
        }

        var statusFile = ResolveStatusFile();
        if (!string.IsNullOrWhiteSpace(statusFile))
        {
            return BuildPathBasedIdentity(statusFile);
        }

        var runDir = ResolveRunDir();
        if (!string.IsNullOrWhiteSpace(runDir))
        {
            return BuildPathBasedIdentity(runDir);
        }

        return $"internal-{Guid.NewGuid():N}";
    }

    public string? ResolvePublicRequestIdentity()
    {
        if (!string.IsNullOrWhiteSpace(RequestNonce))
        {
            return RequestNonce;
        }

        return string.IsNullOrWhiteSpace(RequestId) ? null : RequestId;
    }

    public string? ResolveRequestNonce()
    {
        return string.IsNullOrWhiteSpace(RequestNonce) ? null : RequestNonce;
    }

    public string? ResolveLegacyRequestId()
    {
        return string.IsNullOrWhiteSpace(RequestId) ? null : RequestId;
    }

    private static string BuildPathBasedIdentity(string path)
    {
        var normalized = Path.GetFullPath(path).Trim().ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        var hash = Convert.ToHexString(bytes).ToLowerInvariant()[..12];
        return $"internal-{hash}";
    }
}

public sealed class RunRequestWorkspace
{
    [JsonPropertyName("run_dir")]
    public string RunDir { get; set; } = "";

    [JsonPropertyName("status_file")]
    public string StatusFile { get; set; } = "";
}

public sealed class RunRequestArgs
{
    [JsonPropertyName("list")]
    public string List { get; set; } = "";

    [JsonPropertyName("include_completed")]
    public bool IncludeCompleted { get; set; }

    [JsonPropertyName("allow_delete")]
    public bool AllowDelete { get; set; }
}

public sealed class RunRequestInput
{
    [JsonPropertyName("task_json_file")]
    public string TaskJsonFile { get; set; } = "";
}

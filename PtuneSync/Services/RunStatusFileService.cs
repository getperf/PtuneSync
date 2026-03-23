using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services;

public static class RunStatusFileService
{
    public static async Task WriteAsync(
        string statusFile,
        string requestId,
        string command,
        string phase,
        string status,
        string message,
        object? data = null,
        object? error = null,
        int retryCount = 0)
    {
        if (string.IsNullOrWhiteSpace(statusFile))
        {
            AppLog.Warn("[RunStatusFileService] status_file is empty");
            return;
        }

        try
        {
            var dir = Path.GetDirectoryName(statusFile);
            if (string.IsNullOrWhiteSpace(dir))
            {
                AppLog.Warn("[RunStatusFileService] Invalid status path: {0}", statusFile);
                return;
            }

            Directory.CreateDirectory(dir);
            var tmpFile = statusFile + ".tmp";
            var now = DateTimeOffset.UtcNow.ToString("O");
            var success = status == "success";

            var json = JsonSerializer.Serialize(new
            {
                version = 2,
                schema_version = 1,
                request_id = requestId,
                command,
                phase,
                status,
                success = status == "running" ? (bool?)null : success,
                timestamp = now,
                updated_at = now,
                message,
                retry_count = retryCount,
                data,
                error,
            }, new JsonSerializerOptions { WriteIndented = true });

            await File.WriteAllTextAsync(tmpFile, json, new UTF8Encoding(false));
            await FileUtils.MoveWithRetryAsync(tmpFile, statusFile, overwrite: true);
            AppLog.Info("[RunStatusFileService] Updated status: {0} phase={1} status={2}", statusFile, phase, status);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[RunStatusFileService] Failed to write status: {0}", statusFile);
        }
    }
}

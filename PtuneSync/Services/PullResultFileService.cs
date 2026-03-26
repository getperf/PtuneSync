using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services;

public static class PullResultFileService
{
    public static Task<string?> WriteBackupAsync(string? runDir, object payload)
    {
        return WriteAsync(runDir, "pull-backup.json", payload);
    }

    private static async Task<string?> WriteAsync(string? runDir, string fileName, object payload)
    {
        if (string.IsNullOrWhiteSpace(runDir))
        {
            return null;
        }

        Directory.CreateDirectory(runDir);
        var path = Path.Combine(runDir, fileName);
        var tempPath = path + ".tmp";
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            WriteIndented = true,
        });

        await File.WriteAllTextAsync(tempPath, json, new UTF8Encoding(false));
        await FileUtils.MoveWithRetryAsync(tempPath, path, overwrite: true);
        return path;
    }
}

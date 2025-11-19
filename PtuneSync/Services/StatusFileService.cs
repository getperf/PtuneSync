using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services
{
    public static class StatusFileService
    {
        public static async Task Write(string vaultHome, string op, string msg, string status = "success")
        {
            AppLog.Debug("[StatusFileService] Write Status: vault_home={0}, op={1}, msg={2}", vaultHome, op, msg);

            if (string.IsNullOrWhiteSpace(vaultHome) || !Directory.Exists(vaultHome))
            {
                AppLog.Warn("[StatusFileService] Invalid vault path: {0}", vaultHome);
                return;
            }

            try
            {
                var workDir = Path.Combine(vaultHome, ".obsidian", "plugins", "ptune-log", "work");
                Directory.CreateDirectory(workDir);
                var statusFile = Path.Combine(workDir, "status.json");
                var tmpFile = statusFile + ".tmp";

                var json = JsonSerializer.Serialize(new
                {
                    timestamp = DateTimeOffset.Now.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
                    status,
                    operation = op,
                    message = msg
                }, new JsonSerializerOptions { WriteIndented = true });

                await File.WriteAllTextAsync(tmpFile, json, new UTF8Encoding(false));
                await FileUtils.MoveWithRetryAsync(tmpFile, statusFile, overwrite: true);
                AppLog.Info("[StatusFileService] Status updated: {0}", statusFile);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[StatusFileService] Failed to write status file: {0}", vaultHome);
            }
        }

    }
}

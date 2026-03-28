using System.IO;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services;

public static class TokenWorkDirResolver
{
    public static string Resolve(string? home, string logPrefix)
    {
        var normalizedHome = string.IsNullOrWhiteSpace(home)
            ? null
            : Path.GetFullPath(home);
        var authDir = Path.Combine(
            ProfilePathResolver.ResolveProfileRoot(normalizedHome),
            "auth");

        Directory.CreateDirectory(authDir);
        MigrateLegacyTokenIfNeeded(normalizedHome, authDir, logPrefix);
        return authDir;
    }

    private static void MigrateLegacyTokenIfNeeded(string? normalizedHome, string authDir, string logPrefix)
    {
        var targetTokenFile = Path.Combine(authDir, "token.json");
        if (File.Exists(targetTokenFile) || string.IsNullOrWhiteSpace(normalizedHome))
        {
            return;
        }

        var legacyAuthTokenFile = Path.Combine(normalizedHome, "auth", "token.json");
        if (TryMoveLegacyToken(legacyAuthTokenFile, targetTokenFile, logPrefix))
        {
            return;
        }

        var legacyHomeTokenFile = Path.Combine(normalizedHome, "token.json");
        TryMoveLegacyToken(legacyHomeTokenFile, targetTokenFile, logPrefix);
    }

    private static bool TryMoveLegacyToken(string sourceTokenFile, string targetTokenFile, string logPrefix)
    {
        if (!File.Exists(sourceTokenFile))
        {
            return false;
        }

        Directory.CreateDirectory(Path.GetDirectoryName(targetTokenFile)!);
        File.Move(sourceTokenFile, targetTokenFile, overwrite: true);
        AppLog.Info(
            "[{LogPrefix}] Migrated legacy token.json from {SourceTokenFile} to {TargetTokenFile}",
            logPrefix,
            sourceTokenFile,
            targetTokenFile);
        return true;
    }
}

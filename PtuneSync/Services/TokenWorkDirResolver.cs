using System.IO;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services;

public static class TokenWorkDirResolver
{
    public static string Resolve(string? home, string logPrefix)
    {
        if (!string.IsNullOrWhiteSpace(home))
        {
            var normalizedHome = Path.GetFullPath(home);
            var authDir = Path.Combine(normalizedHome, "auth");
            var authTokenFile = Path.Combine(authDir, "token.json");
            var homeTokenFile = Path.Combine(normalizedHome, "token.json");

            if (Directory.Exists(authDir) || File.Exists(authTokenFile))
            {
                Directory.CreateDirectory(authDir);
                return authDir;
            }

            if (File.Exists(homeTokenFile))
            {
                return normalizedHome;
            }

            Directory.CreateDirectory(authDir);
            return authDir;
        }

        AppLog.Warn("[{LogPrefix}] home missing. Falling back to legacy token path.", logPrefix);
        return AppPaths.WorkDir(AppPaths.VaultHome);
    }
}

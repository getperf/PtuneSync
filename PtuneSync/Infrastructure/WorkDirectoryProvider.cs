using System.IO;

namespace PtuneSync.Infrastructure;

/// <summary>
/// work ディレクトリの解決と生成のみを担当
/// </summary>
public static class WorkDirectoryProvider
{
    public static string GetOrCreate()
    {
        var vaultHome = AppPaths.VaultHome;
        var workDir = Path.Combine(
            vaultHome,
            ".obsidian", "plugins", "ptune-log", "work"
        );

        if (!Directory.Exists(workDir))
        {
            Directory.CreateDirectory(workDir);
        }

        AppLog.Debug("[WorkDirectoryProvider] workDir={0}", workDir);
        return workDir;
    }
}

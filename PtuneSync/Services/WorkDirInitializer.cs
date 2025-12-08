// File: Infrastructure/WorkDirInitializer.cs
using System;
using System.IO;

namespace PtuneSync.Infrastructure;

public static class WorkDirInitializer
{
    public static string EnsureWorkDir()
    {
        var vaultHome = AppPaths.VaultHome;
        var workDir = Path.Combine(
            vaultHome,
            ".obsidian", "plugins", "ptune-log", "work"
        );

        if (!Directory.Exists(workDir))
            Directory.CreateDirectory(workDir);

        AppLog.Debug("[WorkDirInitializer] workDir={0}", workDir);
        return workDir;
    }

    public static string WriteMarkdown(string markdown)
    {
        var workDir = EnsureWorkDir();
        var path = Path.Combine(workDir, "tasks.md");

        File.WriteAllText(path, markdown);
        AppLog.Info("[WorkDirInitializer] Markdown saved: {0}", path);

        return path;
    }
}

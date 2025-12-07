using System.IO;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services
{
    public static class WorkDirInitializer
    {
        public static string EnsureWorkDir()
        {
            // vault_home = LocalState/vault_home/
            var vaultHome = AppPaths.EnsureDirectory(AppPaths.VaultHome);

            // LocalState/vault_home/.obsidian/plugins/ptune-log/work
            var work = AppPaths.WorkDir(vaultHome);
            Directory.CreateDirectory(work);

            AppLog.Debug("[WorkDirInitializer] workDir=" + work);

            return work;
        }
    }
}

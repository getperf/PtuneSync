using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using Windows.System;

namespace PtuneSync.Services
{
    public class ReauthService
    {
        public async Task ExecuteAsync()
        {
            // LocalState/vault_home/.obsidian/plugins/ptune-log/work
            var workDir = WorkDirInitializer.EnsureWorkDir();
            var vaultHome = AppPaths.VaultHome;

            var tokenPath = Path.Combine(workDir, "token.json");
            if (File.Exists(tokenPath))
            {
                File.Delete(tokenPath);
                AppLog.Debug("[ReauthService] token.json removed");
            }

            // GUI 版 URI は vault_home に LocalState/vault_home を指定
            var uri = new Uri(
                $"net.getperf.ptune.googleoauth:/auth?vault_home={Uri.EscapeDataString(vaultHome)}"
            );

            AppLog.Info("[ReauthService] Launch URI: {Uri}", uri);

            await Launcher.LaunchUriAsync(uri);
        }
    }
}

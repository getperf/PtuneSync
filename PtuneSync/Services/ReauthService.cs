using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using Windows.System;

namespace PtuneSync.Services
    {
    public class ReauthService
    {
        public async Task<ProtocolLauncher.ProtocolLaunchResult> ExecuteAsync()
        {
            var vaultHome = AppPaths.VaultHome;
            var workDir = WorkDirInitializer.EnsureWorkDir();

            // token.json 削除
            var token = Path.Combine(workDir, "token.json");
            if (File.Exists(token))
            {
                File.Delete(token);
                AppLog.Debug("[ReauthService] token.json removed");
            }

            var uri = new Uri($"net.getperf.ptune.googleoauth:/auth?vault_home={Uri.EscapeDataString(vaultHome)}");
            var launcher = new ProtocolLauncher(vaultHome);

            var result = await launcher.LaunchAndWaitAsync(uri, "auth");
            return result;
        }
    }
}

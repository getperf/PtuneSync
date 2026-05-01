using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Protocol;

namespace PtuneSync.Services
    {
    public class ReauthService
    {
        private const string Command = "auth-login";

        public async Task<ProtocolLauncher.ProtocolLaunchResult> ExecuteAsync()
        {
            var vaultHome = AppPaths.VaultHome;
            var workDir = WorkDirInitializer.EnsureWorkDir();
            var statusFile = Path.Combine(workDir, "status.json");
            var requestFile = Path.Combine(workDir, "request.json");
            var requestNonce = $"{DateTimeOffset.UtcNow:yyyyMMddTHHmmssfffZ}-{Guid.NewGuid():N}".Substring(0, 22);

            // token.json 削除
            var token = Path.Combine(workDir, "token.json");
            if (File.Exists(token))
            {
                File.Delete(token);
                AppLog.Debug("[ReauthService] token.json removed");
            }

            var request = new RunRequestFile
            {
                SchemaVersion = 1,
                RequestNonce = requestNonce,
                Command = Command,
                CreatedAt = DateTimeOffset.UtcNow.ToString("O"),
                Home = vaultHome,
                StatusFile = statusFile,
                Workspace = new RunRequestWorkspace
                {
                    StatusFile = statusFile,
                },
            };

            var json = JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(requestFile, json, new UTF8Encoding(false));

            var escapedRequestFile = Uri.EscapeDataString(requestFile.Replace('\\', '/'));
            var uri = new Uri($"net.getperf.ptune.googleoauth:/run/auth/login?request_file={escapedRequestFile}");
            var launcher = new ProtocolLauncher(vaultHome);

            AppLog.Info("[ReauthService] Launch auth-login requestFile={0} statusFile={1}", requestFile, statusFile);
            var result = await launcher.LaunchAndWaitAsync(uri, Command);
            return result;
        }
    }
}

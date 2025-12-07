using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

public class ProtocolLauncher
{
    private readonly string _statusFile;
    private readonly TimeSpan _startRetryInterval = TimeSpan.FromSeconds(1);
    private readonly int _startRetryMax = 4;

    public ProtocolLauncher(string vaultHome)
    {
        _statusFile = Path.Combine(
            vaultHome,
            ".obsidian", "plugins", "ptune-log", "work", "status.json"
        );
    }

    // -----------------------------
    // 結果を返すための DTO
    // -----------------------------
    public class ProtocolLaunchResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
    }

    // -----------------------------
    // メイン処理
    // -----------------------------
    public async Task<ProtocolLaunchResult> LaunchAndWaitAsync(Uri uri, string op)
    {
        var baseline = DateTime.Now;

        AppLog.Info("[ProtocolLauncher] LaunchAndWait op={0}", op);

        // --- 起動検出 ---
        bool started = await WaitForStart(uri, baseline);
        if (!started)
        {
            return new ProtocolLaunchResult
            {
                Success = false,
                Message = "アプリ起動を検出できませんでした"
            };
        }

        // --- 完了検出 ---
        return await WaitForCompletion(op, baseline);
    }

    // -----------------------------
    // 起動検出
    // -----------------------------
    private async Task<bool> WaitForStart(Uri uri, DateTime baseline)
    {
        for (int attempt = 1; attempt <= _startRetryMax; attempt++)
        {
            AppLog.Debug("[ProtocolLauncher] Launch attempt {0}", attempt);

            await Windows.System.Launcher.LaunchUriAsync(uri);
            await Task.Delay(_startRetryInterval);

            if (IsStatusFileUpdated(baseline))
            {
                AppLog.Debug("[ProtocolLauncher] launch detected");
                return true;
            }
        }

        AppLog.Warn("[ProtocolLauncher] launch not detected");
        return false;
    }

    private bool IsStatusFileUpdated(DateTime baseline)
    {
        try
        {
            if (!File.Exists(_statusFile))
                return false;

            var mtime = File.GetLastWriteTime(_statusFile);
            return mtime > baseline;
        }
        catch
        {
            return false;
        }
    }

    // -----------------------------
    // 完了検出（成功/失敗 + メッセージ付き）
    // -----------------------------
    private async Task<ProtocolLaunchResult> WaitForCompletion(string op, DateTime baseline)
    {
        AppLog.Debug("[ProtocolLauncher] WaitForCompletion start");

        while (true)
        {
            if (IsStatusFileUpdated(baseline))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(_statusFile);
                    var status = JsonSerializer.Deserialize<StatusFile>(json);

                    if (status != null && status.operation == op)
                    {
                        AppLog.Info("[ProtocolLauncher] status={0}, msg={1}",
                            status.status, status.message ?? "");

                        if (status.status == "success")
                        {
                            return new ProtocolLaunchResult
                            {
                                Success = true,
                                Message = status.message ?? "OK"
                            };
                        }
                        if (status.status == "error")
                        {
                            return new ProtocolLaunchResult
                            {
                                Success = false,
                                Message = status.message ?? "エラーが発生しました"
                            };
                        }
                    }
                }
                catch (Exception ex)
                {
                    AppLog.Error(ex, "[ProtocolLauncher] Failed to read status.json");
                }
            }

            await Task.Delay(800);
        }
    }

    private record StatusFile(string status, string operation, string? message);
}

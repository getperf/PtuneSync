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

    private readonly TimeSpan _completionTimeout = TimeSpan.FromSeconds(90);
    private readonly TimeSpan _completionPolling = TimeSpan.FromMilliseconds(800);

    public ProtocolLauncher(string vaultHome)
    {
        _statusFile = Path.Combine(
            vaultHome,
            ".obsidian", "plugins", "ptune-log", "work", "status.json"
        );
    }

    // ----------------------------------------
    // DTO
    // ----------------------------------------
    public class ProtocolLaunchResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ----------------------------------------
    // メイン処理
    // ----------------------------------------
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

    // ----------------------------------------
    // 起動検出
    // ----------------------------------------
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

    // ----------------------------------------
    // 完了検出
    // ----------------------------------------
    private async Task<ProtocolLaunchResult> WaitForCompletion(string op, DateTime baseline)
    {
        AppLog.Debug("[ProtocolLauncher] WaitForCompletion start");

        var timeoutAt = DateTime.Now + _completionTimeout;

        while (DateTime.Now < timeoutAt)
        {
            if (IsStatusFileUpdated(baseline))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(_statusFile);
                    var status = JsonSerializer.Deserialize<StatusFile>(json);

                    if (status != null)
                    {
                        // operation 不一致はスキップ
                        if (status.operation != op)
                        {
                            AppLog.Debug("[ProtocolLauncher] operation mismatch: {0}", status.operation);
                            goto CONTINUE;
                        }

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
                    AppLog.Error(ex, "[ProtocolLauncher] read status.json failed");
                }
            }

        CONTINUE:
            await Task.Delay(_completionPolling);
        }

        // タイムアウト
        return new ProtocolLaunchResult
        {
            Success = false,
            Message = "処理がタイムアウトしました"
        };
    }

    private record StatusFile(string status, string operation, string? message);
}

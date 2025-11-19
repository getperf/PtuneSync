using Microsoft.Windows.AppNotifications;
using Microsoft.Windows.AppNotifications.Builder;
using PtuneSync.Infrastructure;
using System;

namespace PtuneSync.Infrastructure;

/// <summary>
/// Windows App SDK 標準トースト通知ユーティリティ
/// </summary>
public static class WindowsNotifier
{
    private static bool _initialized;

    /// <summary>
    /// 通知を初期化する（App ID 登録）
    /// </summary>
    public static void Initialize()
    {
        if (_initialized) return;
        try
        {
            // 通知マネージャ初期化（重複呼出し安全）
            Windows.Foundation.IAsyncAction asyncAction = AppNotificationManager.Default.RemoveAllAsync();
            _initialized = true;
            AppLog.Debug("[WindowsNotifier] Initialized AppNotificationManager");
        }
        catch (Exception ex)
        {
            AppLog.Warn("[WindowsNotifier] Init failed: {0}", ex.Message);
        }
    }

    /// <summary>
    /// トースト通知を表示
    /// </summary>
    public static void Show(string title, string message)
    {
        try
        {
            var builder = new AppNotificationBuilder()
                .AddText(title)
                .AddText(message);

            var notification = builder.BuildNotification();
            AppNotificationManager.Default.Show(notification);
        }
        catch (Exception ex)
        {
            AppLog.Warn("[WindowsNotifier] Show failed: {0}", ex.Message);
        }
    }
}

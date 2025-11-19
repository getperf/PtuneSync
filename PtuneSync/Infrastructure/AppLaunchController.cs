using Microsoft.UI.Xaml; // ← 追加
using Microsoft.Windows.AppLifecycle;
using PtuneSync.Protocol;
using Serilog;
using System;

namespace PtuneSync.Infrastructure;

public static class AppLaunchController
{
    public static void HandleActivation(AppActivationArguments args)
    {
        if (args.Kind != ExtendedActivationKind.Protocol)
            return;

        var data = (Windows.ApplicationModel.Activation.ProtocolActivatedEventArgs)args.Data;
        var uri = data.Uri;
        if (uri == null)
        {
            AppLog.Warn("[Activation] URI is null");
            return;
        }

        AppLog.Info("[Activation] Protocol={Uri}", uri);

        if (uri.AbsolutePath.StartsWith("/oauth2redirect", StringComparison.OrdinalIgnoreCase))
        {
            RedirectSignal.Set(uri.AbsoluteUri);
            return;
        }

        _ = ProtocolDispatcher.Dispatch(uri);
        AppLog.Info("[Activation] Protocol dispatch complete.");
    }

    public static void HandleLaunch(Microsoft.UI.Xaml.LaunchActivatedEventArgs args)
    {
        AppLog.Info("[Activation] Launch: GUI mode");
        var window = new MainWindow();
        window.Activate();
    }
}


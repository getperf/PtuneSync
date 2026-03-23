using Microsoft.UI.Xaml;
using Microsoft.Windows.AppLifecycle;
using PtuneSync.Protocol;
using System;
using System.Reflection;

namespace PtuneSync.Infrastructure;

public static class AppLaunchController
{
    public static void HandleActivation(AppActivationArguments args)
    {
        try
        {
            if (args.Kind != ExtendedActivationKind.Protocol)
            {
                AppLog.Warn("[Activation] Non-protocol activation received. Kind={Kind}", args.Kind);
                return;
            }

            var dataType = args.Data?.GetType().FullName ?? "<null>";
            if (!TryGetProtocolUri(args.Data, out var uri) || uri == null)
            {
                AppLog.Warn("[Activation] Failed to resolve protocol URI. DataType={DataType}", dataType);
                return;
            }

            AppLog.Info("[Activation] Protocol={Uri} DataType={DataType}", uri, dataType);

            if (uri.AbsolutePath.StartsWith("/oauth2redirect", StringComparison.OrdinalIgnoreCase))
            {
                AppLog.Info("[Activation] OAuth redirect received.");
                RedirectSignal.Set(uri.AbsoluteUri);
                return;
            }

            _ = ProtocolDispatcher.Dispatch(uri);
            AppLog.Info("[Activation] Protocol dispatch complete.");
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[Activation] HandleActivation failed");
            throw;
        }
    }

    public static void HandleLaunch(LaunchActivatedEventArgs args)
    {
        AppLog.Info("[Activation] Launch: GUI mode");
        var window = new MainWindow();
        window.Activate();
    }

    private static bool TryGetProtocolUri(object? data, out Uri? uri)
    {
        uri = null;
        if (data == null)
            return false;

        if (data is Windows.ApplicationModel.Activation.ProtocolActivatedEventArgs protocolArgs)
        {
            uri = protocolArgs.Uri;
            return uri != null;
        }

        var property = data.GetType().GetProperty("Uri", BindingFlags.Public | BindingFlags.Instance);
        if (property?.GetValue(data) is Uri reflectedUri)
        {
            uri = reflectedUri;
            return true;
        }

        return false;
    }
}

using Microsoft.UI.Xaml;
using Microsoft.Windows.AppLifecycle;
using PtuneSync.Protocol;
using System;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace PtuneSync.Infrastructure;

public static class AppLaunchController
{
    private const int ActivationReadRetryCount = 5;
    private const int ActivationReadRetryDelayMs = 150;

    public static async Task<bool> HandleActivation(AppActivationArguments args)
    {
        try
        {
            if (!TryGetActivationKind(args, out var kind))
            {
                AppLog.Warn("[Activation] Failed to resolve activation kind after retries.");
                return false;
            }

            if (kind != ExtendedActivationKind.Protocol)
            {
                AppLog.Warn("[Activation] Non-protocol activation received. Kind={Kind}", kind);
                return false;
            }

            if (!TryGetProtocolUri(args, out var uri, out var dataType) || uri == null)
            {
                AppLog.Warn("[Activation] Failed to resolve protocol URI. DataType={DataType}", dataType);
                return false;
            }

            AppLog.Info("[Activation] Protocol={Uri} DataType={DataType}", uri, dataType);

            if (uri.AbsolutePath.StartsWith("/oauth2redirect", StringComparison.OrdinalIgnoreCase))
            {
                AppLog.Info("[Activation] OAuth redirect received.");
                RedirectSignal.Set(uri.AbsoluteUri);
                return true;
            }

            await ProtocolDispatcher.Dispatch(uri);
            AppLog.Info("[Activation] Protocol dispatch complete.");
            return true;
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[Activation] HandleActivation failed");
            return false;
        }
    }

    public static void HandleLaunch(LaunchActivatedEventArgs args)
    {
        AppLog.Info("[Activation] Launch: GUI mode");
        var window = new MainWindow();
        window.Activate();
    }

    private static bool TryGetProtocolUri(AppActivationArguments args, out Uri? uri, out string dataType)
    {
        uri = null;
        dataType = "<null>";

        if (!TryGetActivationData(args, out var data, out dataType))
        {
            return false;
        }

        dataType = data?.GetType().FullName ?? "<null>";
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

    private static bool TryGetActivationKind(AppActivationArguments args, out ExtendedActivationKind kind)
    {
        return TryReadWithRetry(
            actionName: "activation kind",
            read: () => args.Kind,
            out kind);
    }

    private static bool TryGetActivationData(AppActivationArguments args, out object? data, out string dataType)
    {
        var ok = TryReadWithRetry(
            actionName: "activation data",
            read: () => args.Data,
            out data);

        dataType = ok
            ? data?.GetType().FullName ?? "<null>"
            : "<com-error>";
        return ok;
    }

    private static bool TryReadWithRetry<T>(string actionName, Func<T> read, out T value)
    {
        for (var attempt = 1; attempt <= ActivationReadRetryCount; attempt++)
        {
            try
            {
                value = read();
                return true;
            }
            catch (COMException ex) when (IsTransientActivationComException(ex) && attempt < ActivationReadRetryCount)
            {
                AppLog.Warn(
                    "[Activation] Transient COM failure while reading {Action}. attempt={Attempt}/{MaxAttempts} hresult=0x{HResult:X8} message={Message}",
                    actionName,
                    attempt,
                    ActivationReadRetryCount,
                    ex.HResult,
                    ex.Message);
                Thread.Sleep(ActivationReadRetryDelayMs);
            }
            catch (COMException ex)
            {
                AppLog.Warn(
                    "[Activation] COM failure while reading {Action}. hresult=0x{HResult:X8} message={Message}",
                    actionName,
                    ex.HResult,
                    ex.Message);
                value = default!;
                return false;
            }
            catch (Exception ex)
            {
                AppLog.Warn(
                    "[Activation] Failure while reading {Action}. message={Message}",
                    actionName,
                    ex.Message);
                value = default!;
                return false;
            }
        }

        value = default!;
        return false;
    }

    private static bool IsTransientActivationComException(COMException ex)
    {
        const int RpcServerUnavailable = unchecked((int)0x800706BA);
        const int RpcCallFailed = unchecked((int)0x800706BE);
        return ex.HResult == RpcServerUnavailable || ex.HResult == RpcCallFailed;
    }
}

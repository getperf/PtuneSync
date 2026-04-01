using System;
using System.Runtime.InteropServices;
using System.Threading;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Microsoft.Windows.AppLifecycle;
using PtuneSync.Infrastructure;
using WinRT;

namespace PtuneSync;

public static class Program
{
    private static AppActivationArguments? _startupActivation;

    [STAThread]
    public static void Main(string[] args)
    {
        XamlCheckProcessRequirements();
        ComWrappersSupport.InitializeComWrappers();

        var keyInstance = AppInstance.FindOrRegisterForKey("main");
        var currentInstance = AppInstance.GetCurrent();
        var activationArgs = currentInstance.GetActivatedEventArgs();

        if (!keyInstance.IsCurrent)
        {
            keyInstance.RedirectActivationToAsync(activationArgs).AsTask().GetAwaiter().GetResult();
            return;
        }

        _startupActivation = activationArgs;
        currentInstance.Activated += OnActivated;

        Application.Start(initParams =>
        {
            var dispatcherQueue = DispatcherQueue.GetForCurrentThread();
            SynchronizationContext.SetSynchronizationContext(
                new DispatcherQueueSynchronizationContext(dispatcherQueue));
            new App();
        });
    }

    private static async void OnActivated(object? sender, AppActivationArguments args)
    {
        var handledActivation = await AppLaunchController.HandleActivation(args);
        if (!handledActivation)
        {
            AppLog.Warn("[Program] Redirected activation was not handled.");
        }

        AppLog.Info("[Program] Redirected activation handled={HandledActivation}", handledActivation);
    }

    public static AppActivationArguments? ConsumeStartupActivation()
    {
        var activation = _startupActivation;
        _startupActivation = null;
        return activation;
    }

    [DllImport("Microsoft.ui.xaml.dll")]
    private static extern void XamlCheckProcessRequirements();
}

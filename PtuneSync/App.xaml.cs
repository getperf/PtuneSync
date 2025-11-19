using System;
using System.Diagnostics;
using Microsoft.UI.Xaml;
using Microsoft.Windows.AppLifecycle;
using PtuneSync.Infrastructure;
using Serilog;
using LaunchActivatedEventArgs = Microsoft.UI.Xaml.LaunchActivatedEventArgs;

namespace PtuneSync;

public partial class App : Application
{
    private readonly bool _isProtocolLaunch;

    public App()
    {
        InitializeComponent();

        var keyInstance = AppInstance.FindOrRegisterForKey("main");
        if (!keyInstance.IsCurrent)
        {
            var args = AppInstance.GetCurrent().GetActivatedEventArgs();
            _ = keyInstance.RedirectActivationToAsync(args);
            Environment.Exit(0);
            return;
        }

        // 起動種別をここで特定
        var currentArgs = AppInstance.GetCurrent().GetActivatedEventArgs();
        _isProtocolLaunch = currentArgs.Kind == ExtendedActivationKind.Protocol;

        AppConfigManager.LoadOrCreate();
        AppLog.Init(AppConfigManager.Config);

        AppLog.Info("[App] Started.");
        AppInstance.GetCurrent().Activated += OnAppActivated;

        var pkg = Windows.ApplicationModel.Package.Current;
        AppLog.Info("[App] PFN={0}", pkg.Id.FamilyName);
        AppLog.Info("[App] PID={0}", Process.GetCurrentProcess().Id);
        AppLog.Info("[App] LaunchMode={0}", _isProtocolLaunch ? "Protocol" : "Normal");
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var activation = AppInstance.GetCurrent().GetActivatedEventArgs();

        if (activation.Kind == ExtendedActivationKind.Protocol)
        {
            AppLog.Info("[App] Protocol launch detected -> skip GUI");
            return;
        }

        AppLog.Info("[App] Normal launch -> show window");
        var window = new MainWindow();
        window.Activate();
    }

    private void OnAppActivated(object? sender, AppActivationArguments args)
    {
        try
        {
            if (args.Kind == ExtendedActivationKind.Protocol)
                AppLaunchController.HandleActivation(args);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[App] OnAppActivated failed");
        }
    }
}

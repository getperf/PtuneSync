// File: PtuneSync/App.xaml.cs
using System;
using Microsoft.UI.Xaml;
using Microsoft.Windows.AppLifecycle;
using PtuneSync.Infrastructure;

namespace PtuneSync;

public partial class App : Application
{
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

        AppConfigManager.LoadOrCreate();
        AppLog.Init(AppConfigManager.Config);

        AppInstance.GetCurrent().Activated += OnAppActivated;
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var activation = AppInstance.GetCurrent().GetActivatedEventArgs();
        var launchMode = LaunchModeService.GetLaunchMode(activation);

        AppLog.Info("[App] OnLaunched mode={LaunchMode}", launchMode);

        if (launchMode == LaunchMode.Protocol)
        {
            AppLog.Info("[App] Protocol launch -> handle activation and skip UI");
            AppLaunchController.HandleActivation(activation);
            return;
        }

        AppLog.Info("[App] Normal launch -> show UI");
        AppLaunchController.HandleLaunch(args);
    }

    private void OnAppActivated(object? sender, AppActivationArguments args)
    {
        var launchMode = LaunchModeService.GetLaunchMode(args);
        AppLog.Info("[App] OnAppActivated mode={LaunchMode}", launchMode);

        if (launchMode == LaunchMode.Protocol)
            AppLaunchController.HandleActivation(args);
    }
}

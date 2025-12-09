// File: PtuneSync/App.xaml.cs
using System;
using System.Diagnostics;
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

        if (LaunchModeService.GetLaunchMode(activation) == LaunchMode.Protocol)
        {
            AppLog.Info("[App] Protocol launch → skip UI");
            return;
        }

        AppLog.Info("[App] Normal launch → show UI");

        var window = new MainWindow();
        window.Activate();
    }

    private void OnAppActivated(object? sender, AppActivationArguments args)
    {
        if (LaunchModeService.GetLaunchMode(args) == LaunchMode.Protocol)
            AppLaunchController.HandleActivation(args);
    }
}

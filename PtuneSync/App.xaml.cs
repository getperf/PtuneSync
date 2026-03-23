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

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        var activation = AppInstance.GetCurrent().GetActivatedEventArgs();
        var handledActivation = await AppLaunchController.HandleActivation(activation);
        AppLog.Info("[App] OnLaunched handledActivation={HandledActivation}", handledActivation);

        if (handledActivation)
        {
            AppLog.Info("[App] Protocol launch -> handle activation and skip UI");
            return;
        }

        AppLog.Info("[App] Normal launch -> show UI");
        AppLaunchController.HandleLaunch(args);
    }

    private async void OnAppActivated(object? sender, AppActivationArguments args)
    {
        var handledActivation = await AppLaunchController.HandleActivation(args);
        if (!handledActivation)
        {
            AppLog.Warn("[App] OnAppActivated retrying with current AppInstance activation args");
            var currentArgs = AppInstance.GetCurrent().GetActivatedEventArgs();
            handledActivation = await AppLaunchController.HandleActivation(currentArgs);
        }

        AppLog.Info("[App] OnAppActivated handledActivation={HandledActivation}", handledActivation);
    }
}

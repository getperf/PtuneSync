// File: PtuneSync/App.xaml.cs
using System;
using System.Threading.Tasks;
using Microsoft.UI.Xaml;
using PtuneSync.Infrastructure;

namespace PtuneSync;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();

        AppConfigManager.LoadOrCreate();
        AppLog.Init(AppConfigManager.Config);
    }

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        var startupActivation = Program.ConsumeStartupActivation();
        if (startupActivation != null)
        {
            AppLog.Info("[App] Startup activation detected in OnLaunched");
            var handledStartupActivation = await AppLaunchController.HandleActivation(startupActivation);
            AppLog.Info("[App] Startup activation task handled={HandledActivation}", handledStartupActivation);
            if (handledStartupActivation)
            {
                AppLog.Info("[App] Startup protocol launch handled before UI");
                return;
            }
        }

        AppLog.Info("[App] Normal launch -> show UI");
        AppLaunchController.HandleLaunch(args);
    }
}

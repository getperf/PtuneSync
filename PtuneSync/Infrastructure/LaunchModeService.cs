// File: PtuneSync/Infrastructure/LaunchModeService.cs
using Microsoft.Windows.AppLifecycle;

namespace PtuneSync.Infrastructure;

public enum LaunchMode
{
    Protocol,
    Normal
}

public static class LaunchModeService
{
    public static LaunchMode GetLaunchMode(AppActivationArguments args)
    {
        return args.Kind == ExtendedActivationKind.Protocol
            ? LaunchMode.Protocol
            : LaunchMode.Normal;
    }
}

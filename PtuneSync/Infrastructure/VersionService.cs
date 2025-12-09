// File: Infrastructure/VersionService.cs
using Microsoft.UI.Xaml;
using System;
using Windows.ApplicationModel;

namespace PtuneSync.Infrastructure;

public static class VersionService
{
    public static string GetAppVersion()
    {
        try
        {
            var package = Package.Current;
            var v = package.Id.Version;

            return $"{v.Major}.{v.Minor}.{v.Build}.{v.Revision}";
        }
        catch
        {
            // unpackaged の場合
            return "Unpackaged (Debug Build)";
        }
    }
}

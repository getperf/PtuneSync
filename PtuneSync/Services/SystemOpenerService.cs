// File: Services/SystemOpenerService.cs
using System;
using System.Threading.Tasks;
using Windows.Storage;
using Windows.System;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services;

public class SystemOpenerService
{
    public async Task<bool> OpenLogFolderAsync()
    {
        var folderPath = AppPaths.Logs;

        try
        {
            var folder = await StorageFolder.GetFolderFromPathAsync(folderPath);
            return await Launcher.LaunchFolderAsync(folder);
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[SystemOpenerService] Failed to open log folder");
            return false;
        }
    }
}

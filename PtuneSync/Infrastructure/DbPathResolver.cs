using System;
using System.IO;
namespace PtuneSync.Infrastructure;

public static class DbPathResolver
{
    private const string DbFileName = "ptune_sync.db";

    public static string ResolveCurrent(string? vaultHome = null)
    {
        return Resolve(AppConfigManager.Config.Database.LocationMode, vaultHome);
    }

    public static string Resolve(DbLocationMode mode, string? vaultHome = null)
    {
        return mode switch
        {
            DbLocationMode.VaultWork => ResolveVaultWork(vaultHome),
            _ => ResolveAppLocal(vaultHome),
        };
    }

    public static bool TryResolveCurrentDisplayPath(out string? path)
    {
        return TryResolveDisplayPath(AppConfigManager.Config.Database.LocationMode, out path);
    }

    public static bool TryResolveDisplayPath(DbLocationMode mode, out string? path)
    {
        var lastVaultHome = AppConfigManager.Config.Database.LastVaultHome;

        if (mode == DbLocationMode.VaultWork)
        {
            if (string.IsNullOrWhiteSpace(lastVaultHome))
            {
                path = null;
                return false;
            }

            path = Resolve(mode, lastVaultHome);
            return true;
        }

        path = Resolve(mode, lastVaultHome);
        return true;
    }

    private static string ResolveVaultWork(string? vaultHome)
    {
        if (string.IsNullOrWhiteSpace(vaultHome))
            throw new InvalidOperationException("VaultWork path resolution requires vaultHome.");

        var resolvedVaultHome = Path.GetFullPath(vaultHome);
        return Path.Combine(
            resolvedVaultHome,
            ".obsidian",
            "plugins",
            "ptune-task",
            "work",
            DbFileName);
    }

    private static string ResolveAppLocal(string? vaultHome)
    {
        return Path.Combine(
            ProfilePathResolver.ResolveProfileRoot(vaultHome),
            "db",
            DbFileName);
    }
}

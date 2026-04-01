using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace PtuneSync.Infrastructure;

public static class ProfilePathResolver
{
    private const string DefaultProfileKey = "default";

    public static string ResolveProfileKey(string? home)
    {
        if (string.IsNullOrWhiteSpace(home))
        {
            return DefaultProfileKey;
        }

        return ComputeProfileKey(Path.GetFullPath(home));
    }

    public static string ResolveProfileRoot(string? home)
    {
        return Path.Combine(
            AppPaths.LocalStateRoot,
            "profiles",
            ResolveProfileKey(home));
    }

    private static string ComputeProfileKey(string normalizedHome)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedHome));
        return Convert.ToHexString(bytes).ToLowerInvariant()[..12];
    }
}

// File: Infrastructure/AppUriBuilder.cs
using System;

namespace PtuneSync.Infrastructure;

public static class AppUriBuilder
{
    private const string Scheme = "net.getperf.ptune.googleoauth";

    public static Uri BuildAuth(string vaultHome)
        => Build("auth", vaultHome);

    public static Uri BuildExport(string vaultHome)
        => Build("export", vaultHome);

    private static Uri Build(string action, string vaultHome)
    {
        var encoded = Uri.EscapeDataString(vaultHome);
        return new Uri($"{Scheme}:/{action}?vault_home={encoded}");
    }
}

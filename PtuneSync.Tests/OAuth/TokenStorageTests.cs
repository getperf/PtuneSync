using System;
using System.IO;
using PtuneSync.OAuth;
using Xunit;

namespace PtuneSync.Tests.OAuth;

public sealed class TokenStorageTests : IDisposable
{
    private readonly string _workDir = Path.Combine(Path.GetTempPath(), "PtuneSync.Tests", Guid.NewGuid().ToString("N"));

    [Fact]
    public void Delete_RemovesExistingTokenFile()
    {
        Directory.CreateDirectory(_workDir);
        var storage = new TokenStorage(_workDir);
        storage.Save(new OAuthToken
        {
            AccessToken = "access",
            RefreshToken = "refresh",
            ExpiresIn = 300,
        });

        storage.Delete();

        Assert.Null(storage.Load());
    }

    [Fact]
    public void Delete_AllowsMissingTokenFile()
    {
        Directory.CreateDirectory(_workDir);
        var storage = new TokenStorage(_workDir);

        var ex = Record.Exception(() => storage.Delete());

        Assert.Null(ex);
        Assert.Null(storage.Load());
    }

    public void Dispose()
    {
        if (Directory.Exists(_workDir))
        {
            Directory.Delete(_workDir, recursive: true);
        }
    }
}

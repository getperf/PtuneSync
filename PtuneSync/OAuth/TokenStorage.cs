using System.IO;
using System.Text.Json;
using PtuneSync.OAuth;
using Serilog;
using PtuneSync.Infrastructure;
using System;

namespace PtuneSync.OAuth;

public class TokenStorage
{
    private readonly string _path;

    public TokenStorage(string workDir)
    {
        Directory.CreateDirectory(workDir);
        _path = Path.Combine(workDir, "token.json");
    }

    public void Save(OAuthToken token)
    {
        token.ExpiresAt = DateTime.Now.AddSeconds(token.ExpiresIn);
        var json = JsonSerializer.Serialize(token, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_path, json);
        AppLog.Debug("[TokenStorage] Saved token.json -> {0}", _path);
        AppLog.Debug("[TokenStorage] ExpiresAt={0}", token.ExpiresAt);
    }

    public OAuthToken? Load()
    {
        if (!File.Exists(_path))
        {
            AppLog.Debug("[TokenStorage] token.json not found: {0}", _path);
            return null;
        }

        var json = File.ReadAllText(_path);
        var token = JsonSerializer.Deserialize<OAuthToken>(json);
        AppLog.Debug("[TokenStorage] Loaded token.json -> {0}", _path);
        AppLog.Debug("[TokenStorage] ExpiresAt={0}", token?.ExpiresAt.ToString() ?? "unkown");
        return token;
    }
}

using System.IO;
using System.Text.Json;
using Serilog;
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
        Log.Debug("[TokenStorage] Saved token.json -> {Path}", _path);
        Log.Debug("[TokenStorage] ExpiresAt={ExpiresAt}", token.ExpiresAt);
    }

    public OAuthToken? Load()
    {
        if (!File.Exists(_path))
        {
            Log.Debug("[TokenStorage] token.json not found: {Path}", _path);
            return null;
        }

        var json = File.ReadAllText(_path);
        var token = JsonSerializer.Deserialize<OAuthToken>(json);
        Log.Debug("[TokenStorage] Loaded token.json -> {Path}", _path);
        Log.Debug("[TokenStorage] ExpiresAt={ExpiresAt}", token?.ExpiresAt.ToString() ?? "unknown");
        return token;
    }

    public void Delete()
    {
        if (!File.Exists(_path))
        {
            Log.Debug("[TokenStorage] Delete skipped; token.json not found: {Path}", _path);
            return;
        }

        File.Delete(_path);
        Log.Information("[TokenStorage] Deleted token.json -> {Path}", _path);
    }
}

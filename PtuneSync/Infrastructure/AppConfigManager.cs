using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using PtuneSync.Infrastructure;

public static class AppConfigManager
{
    private static readonly string LocalFolder = Windows.Storage.ApplicationData.Current.LocalFolder.Path;
    private static readonly string ConfigPath = Path.Combine(LocalFolder, "Config.json");

    public static AppConfig Config { get; private set; } = new();

    // Reflection ベースの JSON シリアライズを確実に許可する
    private static JsonSerializerOptions CreateOptions() =>
        new JsonSerializerOptions
        {
            WriteIndented = true,
            TypeInfoResolver = new DefaultJsonTypeInfoResolver()
        };

    public static void LoadOrCreate()
    {
        try
        {
            if (File.Exists(ConfigPath))
            {
                var json = File.ReadAllText(ConfigPath, Encoding.UTF8);
                Config = Normalize(
                    JsonSerializer.Deserialize<AppConfig>(json, CreateOptions())
                    ?? AppConfig.Default());
            }
            else
            {
                Config = AppConfig.Default();
                Save();
                Console.WriteLine($"[AppConfigManager] Created default config at {ConfigPath}");
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[AppConfigManager] Config load failed: {ex.Message}");
            Config = AppConfig.Default();
            Save();
        }
    }

    public static void Save()
    {
        var json = JsonSerializer.Serialize(Config, CreateOptions());

        var dir = Path.GetDirectoryName(ConfigPath);
        if (string.IsNullOrEmpty(dir))
            throw new InvalidOperationException($"Invalid config directory path: {ConfigPath}");

        Directory.CreateDirectory(dir);
        File.WriteAllText(ConfigPath, json, new UTF8Encoding(false));
    }

    public static void RememberVaultHome(string? vaultHome)
    {
        if (string.IsNullOrWhiteSpace(vaultHome))
            return;

        var normalized = Path.GetFullPath(vaultHome);
        if (string.Equals(Config.Database.LastVaultHome, normalized, StringComparison.OrdinalIgnoreCase))
            return;

        Config.Database.LastVaultHome = normalized;
        Save();
    }

    private static AppConfig Normalize(AppConfig config)
    {
        var defaults = AppConfig.Default();

        config.Logging ??= defaults.Logging;
        config.GoogleOAuth ??= defaults.GoogleOAuth;
        config.Database ??= defaults.Database;
        config.TaskMetadata ??= defaults.TaskMetadata;
        config.OtherSettings ??= defaults.OtherSettings;

        config.TaskMetadata.TagSuggestions ??=
            new List<string>(defaults.TaskMetadata.TagSuggestions);
        config.TaskMetadata.GoalSuggestions ??=
            new List<string>(defaults.TaskMetadata.GoalSuggestions);

        return config;
    }
}

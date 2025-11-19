using System;
using System.IO;
using System.Text;
using System.Text.Json;
using PtuneSync.Infrastructure;

public static class AppConfigManager
{
    private static readonly string LocalFolder = Windows.Storage.ApplicationData.Current.LocalFolder.Path;
    private static readonly string ConfigPath = Path.Combine(LocalFolder, "Config.json");

    public static AppConfig Config { get; private set; } = new();

    public static void LoadOrCreate()
    {
        try
        {
            if (File.Exists(ConfigPath))
            {
                var json = File.ReadAllText(ConfigPath, Encoding.UTF8);
                Config = JsonSerializer.Deserialize<AppConfig>(json) ?? AppConfig.Default();
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
        var json = JsonSerializer.Serialize(Config, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        Directory.CreateDirectory(Path.GetDirectoryName(ConfigPath)!);
        File.WriteAllText(ConfigPath, json, new UTF8Encoding(false));
    }
}
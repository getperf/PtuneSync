using System;
using System.IO;
using System.Text.Json;
using Serilog;
using Serilog.Events;
using Windows.Storage;

namespace PtuneSync.Infrastructure;

public static class AppLog
{
    private static bool _initialized;

    public static void Init(AppConfig config)
    {
        if (_initialized) return;

        var localFolder = ApplicationData.Current.LocalFolder.Path;
        var logsDir = Path.Combine(localFolder, "logs");
        Directory.CreateDirectory(logsDir);

        var level = config.Logging.Level.ToLower() switch
        {
            "debug" => LogEventLevel.Debug,
            "warning" => LogEventLevel.Warning,
            "error" => LogEventLevel.Error,
            _ => LogEventLevel.Information
        };

        var fileName = string.IsNullOrWhiteSpace(config.Logging.FileName)
            ? $"app{DateTime.Now:yyyyMMdd}.log"
            : config.Logging.FileName;

        var logPath = Path.Combine(logsDir, fileName);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Is(level)
            .WriteTo.File(logPath, rollingInterval: RollingInterval.Infinite)
            .CreateLogger();

        Log.Information("Logger initialized. Path={Path}, Level={Level}", logPath, level);
        _initialized = true;
    }

    public static void Info(string message, params object[] args) => Log.Information(message, args);
    public static void Warn(string message, params object[] args) => Log.Warning(message, args);
    public static void Error(Exception ex, string message, params object[] args) => Log.Error(ex, message, args);
    public static void Debug(string message, params object[] args) => Log.Debug(message, args);
}
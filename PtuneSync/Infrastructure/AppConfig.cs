namespace PtuneSync.Infrastructure;

using System.Collections.Generic;

public class AppConfig
{
    public LoggingConfig Logging { get; set; } = new();
    public GoogleOAuthConfig GoogleOAuth { get; set; } = new();
    public DatabaseSettings Database { get; set; } = new();
    public TaskMetadataSettings TaskMetadata { get; set; } = new();
    public OtherSettings OtherSettings { get; set; } = new();

    public static AppConfig Default() => new AppConfig
    {
        Logging = new LoggingConfig
        {
            Level = "Debug",
            FileName = ""
        },
        GoogleOAuth = new GoogleOAuthConfig
        {
            ClientId = "189748391236-stkhp5so69pkh651dolsts98rv2vb899.apps.googleusercontent.com",
            RedirectUri = "net.getperf.ptune.googleoauth:/oauth2redirect",
            Scope = "https://www.googleapis.com/auth/tasks"
        },
        Database = new DatabaseSettings
        {
            LocationMode = DbLocationMode.AppLocal
        },
        TaskMetadata = new TaskMetadataSettings
        {
            TagSuggestions =
            {
                "設計",
                "調査",
                "試作",
                "実装",
                "検証",
            },
            GoalSuggestions =
            {
                "仕様確定",
                "設計整理完了",
                "実装完了",
                "テスト追加完了",
                "リファクタリング完了",
                "バグ修正完了",
            }
        },
        OtherSettings = new OtherSettings
        {
            CheckUpdate = true
        }
    };
}

public class LoggingConfig
{
    public string Level { get; set; } = "Information";
    public string FileName { get; set; } = "";
}

public class GoogleOAuthConfig
{
    public string ClientId { get; set; } = "";
    public string RedirectUri { get; set; } = "";
    public string Scope { get; set; } = "";
}

public class OtherSettings
{
    public bool CheckUpdate { get; set; } = true;
}

public enum DbLocationMode
{
    AppLocal,
    VaultWork,
}

public class DatabaseSettings
{
    public DbLocationMode LocationMode { get; set; } = DbLocationMode.AppLocal;
    public string LastVaultHome { get; set; } = "";
}

public class TaskMetadataSettings
{
    public List<string> TagSuggestions { get; set; } = new();
    public List<string> GoalSuggestions { get; set; } = new();
}

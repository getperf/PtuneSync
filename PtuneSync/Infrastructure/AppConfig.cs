namespace PtuneSync.Infrastructure;

public class AppConfig
{
    public LoggingConfig Logging { get; set; } = new();
    public GoogleOAuthConfig GoogleOAuth { get; set; } = new();
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
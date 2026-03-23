using System.Text.Json.Serialization;

namespace PtuneSync.Protocol;

public sealed class RunRequestFile
{
    [JsonPropertyName("schema_version")]
    public int SchemaVersion { get; set; }

    [JsonPropertyName("request_id")]
    public string RequestId { get; set; } = "";

    [JsonPropertyName("command")]
    public string Command { get; set; } = "";

    [JsonPropertyName("home")]
    public string Home { get; set; } = "";

    [JsonPropertyName("status_file")]
    public string StatusFile { get; set; } = "";
}

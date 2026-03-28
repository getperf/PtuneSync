using System.Text.Json.Serialization;

namespace PtuneSync.Protocol;

public sealed class RunStatusSnapshot
{
    [JsonPropertyName("request_id")]
    public string RequestId { get; set; } = "";

    [JsonPropertyName("command")]
    public string Command { get; set; } = "";

    [JsonPropertyName("phase")]
    public string Phase { get; set; } = "";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";
}

using System.Text.Json.Serialization;

namespace PtuneSync.Protocol;

public sealed class RunStatusSnapshot
{
    [JsonPropertyName("request_nonce")]
    public string RequestNonce { get; set; } = "";

    [JsonPropertyName("request_id")]
    public string RequestId { get; set; } = "";

    [JsonPropertyName("command")]
    public string Command { get; set; } = "";

    [JsonPropertyName("phase")]
    public string Phase { get; set; } = "";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";

    public string? ResolvePublicRequestIdentity()
    {
        if (!string.IsNullOrWhiteSpace(RequestNonce))
        {
            return RequestNonce;
        }

        return string.IsNullOrWhiteSpace(RequestId) ? null : RequestId;
    }
}

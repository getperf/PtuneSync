using System;
using System.Text.Json.Serialization;

namespace PtuneSync.Models;

public class MyTaskList
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("updated")]
    public DateTime? Updated { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    // TypeScript版の key は内部識別子。用途未定なので一旦省略可能。
    public string? Key { get; set; }

    public override string ToString() => $"{Title} ({Id})";
}

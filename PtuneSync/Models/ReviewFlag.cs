// PtuneSync/Models/ReviewFlag.cs
using System.Text.Json.Serialization;

namespace PtuneSync.Models;

/// <summary>
/// タスクレビュー状態（ptune と対称）
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReviewFlag
{
    stuckUnknown,
    toolOrEnvIssue,
    decisionPending,
    scopeExpanded,
    unresolved,
    newIssueFound,
}

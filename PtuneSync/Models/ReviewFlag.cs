// PtuneSync/Models/ReviewFlag.cs
using System.Collections.Generic;

namespace PtuneSync.Models;

/// <summary>
/// ReviewFlag のキー定義（ptune と共通の文字列キー）
/// - PtuneSync では語彙を固定せず string として保持する
/// - ただしタイプミス抑止のため代表キーを定数化しておく（任意）
/// </summary>
public static class ReviewFlagKeys
{
    public const string stuckUnknown = "stuckUnknown";
    public const string toolOrEnvIssue = "toolOrEnvIssue";
    public const string decisionPending = "decisionPending";
    public const string scopeExpanded = "scopeExpanded";
    public const string unresolved = "unresolved";
    public const string newIssueFound = "newIssueFound";

    public static readonly IReadOnlySet<string> Known = new HashSet<string>
    {
        stuckUnknown,
        toolOrEnvIssue,
        decisionPending,
        scopeExpanded,
        unresolved,
        newIssueFound,
    };
}

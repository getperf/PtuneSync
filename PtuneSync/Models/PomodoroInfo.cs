using System;
using System.Text.Json.Serialization;

namespace PtuneSync.Models;

/// <summary>
/// Pomodoroの予定回数と実績回数を保持するモデル。
/// </summary>
public class PomodoroInfo
{
    [JsonPropertyName("planned")]
    public int Planned { get; set; }

    [JsonPropertyName("actual")]
    public double? Actual { get; set; }

    public PomodoroInfo(int planned, double? actual = null)
    {
        Planned = planned;
        Actual = actual;
    }

    /// <summary>
    /// 文字列表現を返す (例: "🍅x3 ✅x2")
    /// </summary>
    public override string ToString()
    {
        string plannedPart = Planned > 0 ? $"🍅x{Planned}" : string.Empty;
        string actualPart = Actual.HasValue ? $" ✅x{Actual}" : string.Empty;
        return $"{plannedPart}{actualPart}".Trim();
    }

    /// <summary>
    /// 実績回数を増やす
    /// </summary>
    public void Done(int count = 1)
    {
        Actual ??= 0;
        Actual += count;
    }
}

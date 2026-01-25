// PtuneSync/Models/ReviewFlagNotesDecoder.cs
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace PtuneSync.Models;

public static class ReviewFlagNotesDecoder
{
    private static readonly Regex Pattern = new(@"#ptune:review=([^\s]+)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>
    /// notes → reviewFlags（集合）
    /// - 未知フラグも落とさない（PtuneSync は変換・搬送が責務）
    /// </summary>
    public static HashSet<string> Decode(string? notes)
    {
        var result = new HashSet<string>();
        if (string.IsNullOrWhiteSpace(notes)) return result;

        var m = Pattern.Match(notes);
        if (!m.Success) return result;

        var raw = m.Groups[1].Value;
        foreach (var part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries))
        {
            var s = part.Trim();
            if (s.Length > 0) result.Add(s);
        }

        return result;
    }
}

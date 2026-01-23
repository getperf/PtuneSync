// PtuneSync/Models/ReviewFlagNotesDecoder.cs
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace PtuneSync.Models;

public static class ReviewFlagNotesDecoder
{
    private static readonly Regex Pattern =
        new(@"#ptune:review=([^\s]+)", RegexOptions.Compiled);

    public static List<ReviewFlag> Decode(string? notes)
    {
        var result = new List<ReviewFlag>();
        if (string.IsNullOrWhiteSpace(notes)) return result;

        var match = Pattern.Match(notes);
        if (!match.Success) return result;

        foreach (var raw in match.Groups[1].Value.Split(','))
        {
            if (Enum.TryParse<ReviewFlag>(raw, out var flag))
                result.Add(flag);
        }
        return result;
    }
}

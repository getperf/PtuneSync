// PtuneSync/Models/ReviewFlagNotesEncoder.cs
using System.Collections.Generic;
using System.Linq;

namespace PtuneSync.Models;

public static class ReviewFlagNotesEncoder
{
    private const string Prefix = "#ptune:review=";

    public static string? Encode(IEnumerable<ReviewFlag> flags)
    {
        var list = flags?.ToList() ?? new();
        return list.Count == 0
            ? null
            : Prefix + string.Join(",", list.Select(f => f.ToString()));
    }
}

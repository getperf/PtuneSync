// PtuneSync/Models/ReviewFlagNotesEncoder.cs
using System.Collections.Generic;
using System.Linq;

namespace PtuneSync.Models;

public static class ReviewFlagNotesEncoder
{
    /// <summary>
    /// reviewFlags → "#ptune:review=flag1,flag2"
    /// 空の場合は null
    /// </summary>
    public static string? Encode(IEnumerable<string> flags)
    {
        if (flags is null) return null;

        var uniq = new HashSet<string>(flags.Where(s => !string.IsNullOrWhiteSpace(s))
                                            .Select(s => s.Trim()));

        if (uniq.Count == 0) return null;

        return $"#ptune:review={string.Join(",", uniq)}";
    }
}

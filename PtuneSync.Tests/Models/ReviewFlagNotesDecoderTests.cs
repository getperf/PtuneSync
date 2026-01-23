// PtuneSync.Tests/ReviewFlagNotesDecoderTests.cs
using System.Linq;
using PtuneSync.Models;
using Xunit;

namespace PtuneSync.Tests.Models;

public class ReviewFlagNotesDecoderTests
{
    [Fact]
    public void Decode_ValidFlags()
    {
        var notes = "#ptune:review=stuckUnknown,unresolved";

        var flags = ReviewFlagNotesDecoder.Decode(notes);

        Assert.Equal(2, flags.Count);
        Assert.Contains(ReviewFlag.stuckUnknown, flags);
        Assert.Contains(ReviewFlag.unresolved, flags);
    }

    [Fact]
    public void Decode_IgnoreUnknownFlag()
    {
        var notes = "#ptune:review=stuckUnknown,unknownFlag,unresolved";

        var flags = ReviewFlagNotesDecoder.Decode(notes);

        Assert.Equal(2, flags.Count);
        Assert.DoesNotContain(flags, f => f.ToString() == "unknownFlag");
    }
}

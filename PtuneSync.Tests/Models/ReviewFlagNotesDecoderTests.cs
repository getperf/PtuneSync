// PtuneSync.Tests/Models/ReviewFlagNotesDecoderTests.cs
using PtuneSync.Models;
using Xunit;

namespace PtuneSync.Tests.Models;

public class ReviewFlagNotesDecoderTests
{
    [Fact]
    public void Decode_FindsFlags()
    {
        var notes = "aaa\n#ptune:review=stuckUnknown,unresolved\nbbb";
        var flags = ReviewFlagNotesDecoder.Decode(notes);

        Assert.Contains(ReviewFlagKeys.stuckUnknown, flags);
        Assert.Contains(ReviewFlagKeys.unresolved, flags);
    }

    [Fact]
    public void Decode_NoMarker_ReturnsEmpty()
    {
        var notes = "no review here";
        var flags = ReviewFlagNotesDecoder.Decode(notes);

        Assert.Empty(flags);
    }
}

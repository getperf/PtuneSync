// PtuneSync.Tests/Models/ReviewFlagNotesEncoderTests.cs
using PtuneSync.Models;
using Xunit;

namespace PtuneSync.Tests.Models;

public class ReviewFlagNotesEncoderTests
{
    [Fact]
    public void Encode_Empty_ReturnsNull()
    {
        var result = ReviewFlagNotesEncoder.Encode(Array.Empty<string>());
        Assert.Null(result);
    }

    [Fact]
    public void Encode_RoundTrip()
    {
        var original = new List<string>
        {
            ReviewFlagKeys.decisionPending,
            ReviewFlagKeys.scopeExpanded
        };

        var encoded = ReviewFlagNotesEncoder.Encode(original);
        var decoded = ReviewFlagNotesDecoder.Decode(encoded);

        Assert.NotNull(encoded);
        Assert.Contains(ReviewFlagKeys.decisionPending, decoded);
        Assert.Contains(ReviewFlagKeys.scopeExpanded, decoded);
    }
}

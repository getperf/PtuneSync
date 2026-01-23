// PtuneSync.Tests/ReviewFlagNotesEncoderTests.cs
using System.Collections.Generic;
using PtuneSync.Models;
using Xunit;

namespace PtuneSync.Tests.Models;

public class ReviewFlagNotesEncoderTests
{
    [Fact]
    public void Encode_Empty_ReturnsNull()
    {
        var result = ReviewFlagNotesEncoder.Encode(new List<ReviewFlag>());

        Assert.Null(result);
    }

    [Fact]
    public void EncodeDecode_RoundTrip()
    {
        var original = new[]
        {
            ReviewFlag.decisionPending,
            ReviewFlag.scopeExpanded
        };

        var encoded = ReviewFlagNotesEncoder.Encode(original);
        var decoded = ReviewFlagNotesDecoder.Decode(encoded);

        Assert.Equal(original.Length, decoded.Count);
        Assert.Equal(original, decoded);
    }
}

using Xunit;
using PtuneSync.Models;

namespace PtuneSync.Tests.Models;

public class PomodoroInfoTests
{
    [Fact]
    public void ToString_ReturnsFullFormat()
    {
        var info = new PomodoroInfo(3, 2);
        Assert.Equal("🍅x3 ✅x2", info.ToString());
    }

    [Fact]
    public void ToString_ReturnsOnlyPlanned()
    {
        var info = new PomodoroInfo(4);
        Assert.Equal("🍅x4", info.ToString());
    }

    [Fact]
    public void Done_IncrementsActualCorrectly()
    {
        var info = new PomodoroInfo(2);
        info.Done();
        Assert.Equal(1, info.Actual);
        info.Done(2);
        Assert.Equal(3, info.Actual);
    }
}

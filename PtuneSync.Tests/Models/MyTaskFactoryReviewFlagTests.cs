// PtuneSync.Tests/MyTaskFactoryReviewFlagTests.cs
using System.Collections.Generic;
using PtuneSync.Models;
using Xunit;

namespace PtuneSync.Tests.Models;

public class MyTaskFactoryReviewFlagTests
{
    [Fact]
    public void FromApiData_DecodeReviewFlags()
    {
        var apiTask = new Dictionary<string, object>
        {
            ["id"] = "task1",
            ["title"] = "Test Task",
            ["status"] = "needsAction",
            ["notes"] = "#ptune:review=stuckUnknown,unresolved"
        };

        var task = MyTaskFactory.FromApiData(apiTask);

        Assert.NotNull(task.ReviewFlags);
        Assert.Equal(2, task.ReviewFlags.Count);
        Assert.Contains("stuckUnknown", task.ReviewFlags);
        Assert.Contains("unresolved", task.ReviewFlags);
    }
}

using Xunit;
using PtuneSync.Models;

namespace PtuneSync.Tests.Models;

public class MyTaskListTests
{
    [Fact]
    public void ToString_ReturnsTitleAndId()
    {
        var list = new MyTaskList { Id = "abc123", Title = "Today" };
        Assert.Equal("Today (abc123)", list.ToString());
    }

    [Fact]
    public void JsonDeserialization_Works()
    {
        var json = @"{ ""id"": ""x1"", ""title"": ""Backlog"" }";
        var model = System.Text.Json.JsonSerializer.Deserialize<MyTaskList>(json);
        Assert.NotNull(model);
        Assert.Equal("Backlog", model!.Title);
    }
}
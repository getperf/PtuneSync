using Xunit;
using PtuneSync.Models;
using System.Text.RegularExpressions;

namespace PtuneSync.Tests.Models;

public class MyTaskTests
{
    [Fact]
    public void ToString_IncludesStatusAndPomodoro()
    {
        var task = new MyTask("1", "Test Task", new PomodoroInfo(2, 1), "completed");
        Assert.Equal("[x] Test Task 🍅x2 ✅x1", task.ToString());
    }

    [Fact]
    public void ToApiData_ConvertsToExpectedFormat()
    {
        var task = new MyTask("1", "Title", new PomodoroInfo(2), "needsAction")
        {
            Note = "note"
        };
        var data = task.ToApiData();
        Assert.Equal("Title", data["title"]);
        Assert.Contains("🍅x2", data["notes"].ToString());
        Assert.Equal("needsAction", data["status"]);
    }

    [Fact]
    public void ToString_IncludesTimeRange_WhenStartedAndCompletedSet()
    {
        var started = "2025-07-27T09:47:49Z";
        var completed = "2025-07-27T09:48:16Z";
        var task = new MyTask("2", "Time Task", new PomodoroInfo(1), "completed")
        {
            Started = started,
            Completed = completed
        };
        var str = task.ToString();
        Assert.Matches(@"\[x\] Time Task 🍅x1 \d{1,2}:\d{2}:\d{2} - \d{1,2}:\d{2}:\d{2}", str);
    }

    [Fact]
    public void ToString_IncludesOnlyStartedTime_WhenCompletedMissing()
    {
        var started = "2025-07-27T09:47:49Z";
        var task = new MyTask("3", "Partial Time Task", new PomodoroInfo(1))
        {
            Started = started
        };
        var str = task.ToString();
        Assert.Matches(@"\[ \] Partial Time Task 🍅x1 \d{1,2}:\d{2}:\d{2}", str);
    }

    [Fact]
    public void ToString_OmitsTime_WhenNoStartOrComplete()
    {
        var task = new MyTask("4", "No Time Task", new PomodoroInfo(1));
        var str = task.ToString();
        Assert.Equal("[ ] No Time Task 🍅x1", str);
    }

    [Fact]
    public void CloneWithoutActuals_RemovesTimeAndActual()
    {
        var task = new MyTask("1", "Clone Test", new PomodoroInfo(2, 1), "completed")
        {
            Started = "2025-07-27T09:47:49Z",
            Completed = "2025-07-27T09:48:16Z"
        };
        var clone = task.CloneWithoutActuals();
        Assert.Null(clone.Started);
        Assert.Null(clone.Completed);
        Assert.Null(clone.Pomodoro!.Actual);
    }
}

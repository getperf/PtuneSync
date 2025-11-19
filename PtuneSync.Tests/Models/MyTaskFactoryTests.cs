using Xunit;
using PtuneSync.Models;
using System.Collections.Generic;

namespace PtuneSync.Tests.Models;

public class MyTaskFactoryTests
{
    [Fact]
    public void FromApiData_ParsesPomodoroAndNote()
    {
        var apiTask = new Dictionary<string, object>
        {
            ["id"] = "123",
            ["title"] = "Test Task",
            ["notes"] = "Note 🍅x2 ✅x1",
            ["status"] = "needsAction",
            ["due"] = "2024-06-13T10:00:00.000Z"
        };

        var task = MyTaskFactory.FromApiData(apiTask, "todayList");

        Assert.Equal("123", task.Id);
        Assert.Equal("Test Task", task.Title);
        Assert.Equal("todayList", task.TaskListId);
        Assert.Equal("Note", task.Note);
        Assert.Equal(2, task.Pomodoro?.Planned);
        Assert.Equal(1, task.Pomodoro?.Actual);
        Assert.Equal("2024-06-13T10:00:00.000Z", task.Due);
    }

    [Fact]
    public void ReturnsUndefinedPomodoroIfMissingTomato()
    {
        var api = new Dictionary<string, object>
        {
            ["id"] = "1",
            ["title"] = "No Tomato",
            ["notes"] = "just a note"
        };
        var task = MyTaskFactory.FromApiData(api, "today");
        Assert.Null(task.Pomodoro);
    }

    [Fact]
    public void ReturnsUndefinedPomodoroIfZeroTomato()
    {
        var api = new Dictionary<string, object>
        {
            ["id"] = "2",
            ["title"] = "Zero Tomato",
            ["notes"] = "prep 🍅x0"
        };
        var task = MyTaskFactory.FromApiData(api, "today");
        Assert.Null(task.Pomodoro);
    }

    [Fact]
    public void ParsesPomodoroIfPresent()
    {
        var api = new Dictionary<string, object>
        {
            ["id"] = "3",
            ["title"] = "Valid Pomodoro",
            ["notes"] = "task 🍅x3 ✅x2"
        };
        var task = MyTaskFactory.FromApiData(api, "today");
        Assert.NotNull(task.Pomodoro);
        Assert.Equal(3, task.Pomodoro?.Planned);
        Assert.Equal(2, task.Pomodoro?.Actual);
    }

    [Fact]
    public void CopyTaskData_CopiesExceptId()
    {
        var source = new MyTask("abc", "Source Task", new PomodoroInfo(3, 1));
        source.Note = "Test";

        var target = new MyTask("xyz", "Target Task");
        MyTaskFactory.CopyTaskData(source, target);

        Assert.Equal("xyz", target.Id);
        Assert.Equal("Test", target.Note);
        Assert.Equal(3, target.Pomodoro?.Planned);
        Assert.Equal(1, target.Pomodoro?.Actual);
    }

    [Fact]
    public void ParsesStartedAndCompletedFromNotes()
    {
        var notes = "🍅x1 ✅x1 started=2025-07-27T09:47:49.902210 completed=2025-07-27T09:48:16.564339";
        var api = new Dictionary<string, object>
        {
            ["id"] = "123",
            ["title"] = "Test Task",
            ["notes"] = notes,
            ["updated"] = "2025-07-27T09:50:00.000Z"
        };
        var task = MyTaskFactory.FromApiData(api, "list-1");
        Assert.Equal("2025-07-27T09:47:49.902210", task.Started);
        Assert.Equal("2025-07-27T09:48:16.564339", task.Completed);
        Assert.Null(task.Note);
    }

    [Fact]
    public void ParsesOnlyStartedWhenCompletedMissing()
    {
        var notes = "🍅x2 started=2025-07-27T09:00:00.000Z";
        var api = new Dictionary<string, object>
        {
            ["id"] = "456",
            ["title"] = "Started Only",
            ["notes"] = notes
        };
        var task = MyTaskFactory.FromApiData(api);
        Assert.Equal("2025-07-27T09:00:00.000Z", task.Started);
        Assert.Null(task.Completed);
    }

    [Fact]
    public void ParsesCompletedFromTaskCompletedField()
    {
        var api = new Dictionary<string, object>
        {
            ["id"] = "789",
            ["title"] = "API Completed",
            ["notes"] = "🍅x1",
            ["completed"] = "2025-07-27T10:00:00.000Z"
        };
        var task = MyTaskFactory.FromApiData(api);
        Assert.Equal("2025-07-27T10:00:00.000Z", task.Completed);
    }

    [Fact]
    public void RemovesStartedAndCompletedFromNoteBody()
    {
        var api = new Dictionary<string, object>
        {
            ["id"] = "999",
            ["title"] = "Cleanup Note",
            ["notes"] = "memo 🍅x1 started=2025-07-27T00:47:49.902210 completed=2025-07-27T00:48:16.564339"
        };
        var task = MyTaskFactory.FromApiData(api);
        Assert.Equal("memo", task.Note);
    }
}

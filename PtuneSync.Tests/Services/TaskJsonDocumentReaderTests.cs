using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using PtuneSync.Models;
using PtuneSync.Services;

namespace PtuneSync.Tests.Services;

public class TaskJsonDocumentReaderTests
{
    [Fact]
    public void ToTaskJsonTasks_MapsPullContractFields()
    {
        var source = new MyTask("task-1", "Write report", new PomodoroInfo(3, 1.5), "completed")
        {
            Parent = "parent-1",
            Started = "2026-04-01T00:00:00Z",
            Completed = "2026-04-01T01:00:00Z",
            Due = "2026-04-01T12:00:00Z",
            Note = "memo",
            Goal = "focus",
            Tags = new List<string> { "work", "deep" },
            ReviewFlags = new HashSet<string> { "operationMiss" },
        };

        var mapped = TaskJsonDocumentReader.ToTaskJsonTasks(new[] { source }).Single();
        var json = JsonSerializer.Serialize(mapped);

        Assert.Contains("\"pomodoro_planned\":3", json);
        Assert.Contains("\"pomodoro_actual\":1.5", json);
        Assert.Contains("\"review_flags\":[", json);
        Assert.DoesNotContain("\"pomodoro\":", json);
        Assert.DoesNotContain("\"reviewFlags\":", json);
        Assert.DoesNotContain("\"subTasks\":", json);
        Assert.Equal("parent-1", mapped.Parent);
    }

    [Fact]
    public void ToMyTasks_PreservesParent()
    {
        var source = new TaskJsonTask
        {
            Id = "task-1",
            Title = "Child task",
            Parent = "parent-1",
            PomodoroPlanned = 2,
            PomodoroActual = 1,
            Status = "needsAction",
        };

        var mapped = TaskJsonDocumentReader.ToMyTasks(new[] { source }).Single();

        Assert.Equal("parent-1", mapped.Parent);
        Assert.Equal(2, mapped.Pomodoro?.Planned);
        Assert.Equal(1, mapped.Pomodoro?.Actual);
    }
}

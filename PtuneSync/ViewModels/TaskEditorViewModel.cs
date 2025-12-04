// File: PtuneSync/ViewModels/TaskEditorViewModel.cs
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Collections.Generic;
using PtuneSync.Models;

namespace PtuneSync.ViewModels;

public class TaskEditorViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    public ObservableCollection<TaskItem> Tasks { get; } =
        new ObservableCollection<TaskItem>();

    public void AddParentTask()
    {
        Tasks.Add(new TaskItem { Title = "新しいタスク", IsChild = false });
    }

    public void AddChildTask()
    {
        Tasks.Add(new TaskItem { Title = "子タスク", IsChild = true, Pomodoro = 1 });
    }

    public IEnumerable<string> BuildMarkdown()
    {
        foreach (var t in Tasks)
        {
            var indent = t.IsChild ? "  " : "";
            var pomo = t.Pomodoro > 0 ? $" 🍅x{t.Pomodoro}" : "";
            yield return $"{indent}- [ ] {t.Title}{pomo}";
        }
    }
}

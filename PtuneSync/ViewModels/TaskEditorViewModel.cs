// File: ViewModels/TaskEditorViewModel.cs
using System.Collections.ObjectModel;
using PtuneSync.Models;

namespace PtuneSync.ViewModels;

public class TaskEditorViewModel
{
    public ObservableCollection<TaskItem> Tasks { get; } =
        new ObservableCollection<TaskItem>();

    public TaskEditorViewModel()
    {
        // 初期表示用サンプル
        Tasks.Add(new TaskItem { Title = "タスクA" });
        Tasks.Add(new TaskItem { Title = "タスクB" });
        Tasks.Add(new TaskItem { Title = "タスクC" });
    }
}

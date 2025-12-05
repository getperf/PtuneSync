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
        // 初期表示用のテストデータ
        Tasks.Add(new TaskItem { Title = "親タスク A", IsChild = false });
        Tasks.Add(new TaskItem { Title = "子タスク B", IsChild = true });
        Tasks.Add(new TaskItem { Title = "親タスク C", IsChild = false });
    }
}

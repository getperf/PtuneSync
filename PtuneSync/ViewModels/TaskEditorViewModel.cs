// File: ViewModels/TaskEditorViewModel.cs
using System.Collections.ObjectModel;
using PtuneSync.Models;
using PtuneSync.Infrastructure;

namespace PtuneSync.ViewModels;

public class TaskEditorViewModel
{
    public ObservableCollection<TaskItem> Tasks { get; } = new();

    public TaskEditorViewModel()
    {
        // ★ 初期化中として TaskItem を作成
        var a = new TaskItem { Title = "親タスク A", IsChild = false };
        var b = new TaskItem { Title = "子タスク B", IsChild = true, PlannedPomodoroCount = 2 };
        var c = new TaskItem { Title = "親タスク C", IsChild = false, PlannedPomodoroCount = 1 };

        Tasks.Add(a);
        Tasks.Add(b);
        Tasks.Add(c);

        RefreshIndexes();

        // ★ ここで初期化完了（IsChild setter が通常ロジックに戻る）
        foreach (var t in Tasks)
        {
            t.IsInitializing = false;
            AppLog.Debug("[TaskEditorVM] Init flag OFF: Title={0}, IsChild={1}, Index={2}", t.Title, t.IsChild, t.Index);
        }
    }

    public void RefreshIndexes()
    {
        for (int i = 0; i < Tasks.Count; i++)
        {
            Tasks[i].Index = i;
        }
    }
}

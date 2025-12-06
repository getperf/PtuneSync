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
        var a = new TaskItem { Title = "親タスク A", IsChild = false };
        var b = new TaskItem { Title = "子タスク B", IsChild = true, PlannedPomodoroCount = 2 };
        var c = new TaskItem { Title = "親タスク C", IsChild = false, PlannedPomodoroCount = 1 };

        Tasks.Add(a);
        Tasks.Add(b);
        Tasks.Add(c);

        RefreshIndexes();

        // ★ 初期化完了（setter ガード有効化）
        a.IsInitializing = false;
        b.IsInitializing = false;
        c.IsInitializing = false;
    }

    // タスク削除
    public void DeleteTask(TaskItem target)
    {
        AppLog.Info("[VM] DeleteTask: Title={0}", target.Title);

        Tasks.Remove(target);
        RefreshIndexes();

        if (Tasks.Count > 0)
        {
            var first = Tasks[0];
            if (first.IsChild)
            {
                AppLog.Info("[VM] First task was child → force reset to parent: {0}", first.Title);
                first.ForceSetIsChild(false);
            }
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

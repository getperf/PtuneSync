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

        a.IsInitializing = false;
        b.IsInitializing = false;
        c.IsInitializing = false;
    }

    // ★ 新規タスク追加（最後のタスクの親子属性を継承）
    public TaskItem AddTask()
    {
        bool isChild = false;

        if (Tasks.Count > 0)
        {
            var last = Tasks[Tasks.Count - 1];
            isChild = last.IsChild;
        }

        var newTask = new TaskItem
        {
            Title = "",
            IsChild = isChild
        };

        Tasks.Add(newTask);
        RefreshIndexes();

        newTask.IsInitializing = false;

        AppLog.Info("[VM] AddTask: IsChild={0}, Index={1}", newTask.IsChild, newTask.Index);

        return newTask;
    }

    public void DeleteTask(TaskItem target)
    {
        Tasks.Remove(target);
        RefreshIndexes();

        // ★ 1 行目補正（セッターは禁止、必ず ForceSet を使う）
        if (Tasks.Count > 0)
        {
            var first = Tasks[0];
            if (first.IsChild)
            {
                AppLog.Info("[VM] First task was child → Force reset to parent: {0}", first.Title);
                first.ForceSetIsChild(false);
            }
        }
    }

    public void RefreshIndexes()
    {
        for (int i = 0; i < Tasks.Count; i++)
            Tasks[i].Index = i;
    }

}

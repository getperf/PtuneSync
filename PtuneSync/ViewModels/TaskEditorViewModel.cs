using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Messaging;

using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Linq;
using PtuneSync.Infrastructure;
using PtuneSync.Messages;
using PtuneSync.Models;
using System;

namespace PtuneSync.ViewModels;

// ★ ObservableRecipient を継承
public partial class TaskEditorViewModel : ObservableRecipient
{
    private IReadOnlyList<string> _tagSuggestions = new List<string>();
    private IReadOnlyList<string> _goalSuggestions = new List<string>();

    public ObservableCollection<TaskItem> Tasks { get; } = new();

    public IReadOnlyList<string> TagSuggestions => _tagSuggestions;
    public IReadOnlyList<string> GoalSuggestions => _goalSuggestions;

    public TaskEditorViewModel()
    {
        AppLog.Debug("[TaskEditorViewModel] Constructor invoked");
        ReloadSuggestions();

        // Messenger 受信用に有効化
        IsActive = true;

        // 初期データ
        // var a = new TaskItem { Title = "親タスク A", IsChild = false };
        // var b = new TaskItem { Title = "子タスク B", IsChild = true, PlannedPomodoroCount = 2 };
        // var c = new TaskItem { Title = "親タスク C", IsChild = false, PlannedPomodoroCount = 1 };

        // Tasks.Add(a);
        // Tasks.Add(b);
        // Tasks.Add(c);

        // RefreshIndexes();

        // a.IsInitializing = false;
        // b.IsInitializing = false;
        // c.IsInitializing = false;

        // ★ Reset メッセージ受信
        WeakReferenceMessenger.Default.Register<ResetTasksMessage>(this, (r, m) =>
        {
            AppLog.Debug("[TaskEditorViewModel] ResetTasksMessage received -> clearing tasks");
            Tasks.Clear();
            AppLog.Debug($"[TaskEditorViewModel] Cleared. count={Tasks.Count}");
        });
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
        newTask.InitializeMetadataSuggestions(_tagSuggestions, _goalSuggestions);

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

    public void ReloadSuggestions()
    {
        _tagSuggestions = AppConfigManager.Config.TaskMetadata.TagSuggestions;
        _goalSuggestions = AppConfigManager.Config.TaskMetadata.GoalSuggestions;

        foreach (var task in Tasks)
        {
            var selectedTags = task.GetSelectedTags();
            task.InitializeMetadataSuggestions(_tagSuggestions, _goalSuggestions);
            task.SetSelectedTags(selectedTags);
        }
    }

    public void LoadFromMyTasks(IEnumerable<MyTask> tasks)
    {
        Tasks.Clear();

        foreach (var source in tasks)
        {
            if (string.IsNullOrWhiteSpace(source.Title))
            {
                continue;
            }

            var task = new TaskItem
            {
                Title = source.Title,
                IsChild = !string.IsNullOrWhiteSpace(source.Parent),
                PlannedPomodoroCount = source.Pomodoro?.Planned ?? 0,
                Goal = source.Goal,
                RemoteId = string.IsNullOrWhiteSpace(source.Id) ? null : source.Id,
                RemoteParentId = source.Parent,
                Status = string.IsNullOrWhiteSpace(source.Status) ? "needsAction" : source.Status,
                Started = source.Started,
                Completed = source.Completed,
                Due = source.Due,
            };

            var mergedTagSuggestions = _tagSuggestions
                .Concat(source.Tags ?? Enumerable.Empty<string>())
                .Where(static tag => !string.IsNullOrWhiteSpace(tag))
                .Select(static tag => tag.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();

            task.InitializeMetadataSuggestions(mergedTagSuggestions, _goalSuggestions);
            task.SetSelectedTags(source.Tags);

            Tasks.Add(task);
        }

        RefreshIndexes();

        foreach (var task in Tasks)
        {
            task.IsInitializing = false;
        }

        if (Tasks.Count > 0 && Tasks[0].IsChild)
        {
            Tasks[0].ForceSetIsChild(false);
        }
    }
}

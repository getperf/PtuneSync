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

        foreach (var task in BuildTaskItems(tasks))
        {
            Tasks.Add(task);
        }

        FinalizeTaskLayout();
    }

    public void MergeFromMyTasks(IEnumerable<MyTask> tasks)
    {
        var pulledTasks = BuildTaskItems(tasks).ToList();
        var existingByRemoteId = Tasks
            .Where(static task => !string.IsNullOrWhiteSpace(task.RemoteId))
            .GroupBy(static task => task.RemoteId!, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.Ordinal);
        var existingByTitleKey = BuildTitleKeyMap(Tasks);
        string? currentPulledParentTitle = null;

        foreach (var pulled in pulledTasks)
        {
            if (!string.IsNullOrWhiteSpace(pulled.RemoteId)
                && existingByRemoteId.TryGetValue(pulled.RemoteId, out var existing))
            {
                CopyTaskState(existing, pulled);
                if (!pulled.IsChild)
                {
                    currentPulledParentTitle = NormalizeTitle(pulled.Title);
                }
                continue;
            }

            var titleKey = BuildTitleKey(pulled, currentPulledParentTitle);
            if (existingByTitleKey.TryGetValue(titleKey, out var matchedTasks)
                && matchedTasks.Count > 0)
            {
                var existingByTitle = matchedTasks.Dequeue();
                CopyTaskState(existingByTitle, pulled);
                if (!pulled.IsChild)
                {
                    currentPulledParentTitle = NormalizeTitle(pulled.Title);
                }
                continue;
            }

            pulled.IsInitializing = false;
            Tasks.Add(pulled);
            if (!pulled.IsChild)
            {
                currentPulledParentTitle = NormalizeTitle(pulled.Title);
            }
        }

        FinalizeTaskLayout();
    }

    private IEnumerable<TaskItem> BuildTaskItems(IEnumerable<MyTask> tasks)
    {
        foreach (var source in tasks)
        {
            if (string.IsNullOrWhiteSpace(source.Title))
            {
                continue;
            }

            var task = new TaskItem();
            CopyTaskState(task, source);
            yield return task;
        }
    }

    private void CopyTaskState(TaskItem target, MyTask source)
    {
        target.Title = source.Title;
        target.IsChild = !string.IsNullOrWhiteSpace(source.Parent);
        target.PlannedPomodoroCount = source.Pomodoro?.Planned ?? 0;
        target.Goal = source.Goal;
        target.RemoteId = string.IsNullOrWhiteSpace(source.Id) ? null : source.Id;
        target.RemoteParentId = source.Parent;
        target.Status = string.IsNullOrWhiteSpace(source.Status) ? "needsAction" : source.Status;
        target.Started = source.Started;
        target.Completed = source.Completed;
        target.Due = source.Due;

        var mergedTagSuggestions = _tagSuggestions
            .Concat(source.Tags ?? Enumerable.Empty<string>())
            .Where(static tag => !string.IsNullOrWhiteSpace(tag))
            .Select(static tag => tag.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        target.InitializeMetadataSuggestions(mergedTagSuggestions, _goalSuggestions);
        target.SetSelectedTags(source.Tags);
    }

    private void CopyTaskState(TaskItem target, TaskItem source)
    {
        target.Title = source.Title;
        target.IsChild = source.IsChild;
        target.PlannedPomodoroCount = source.PlannedPomodoroCount;
        target.Goal = source.Goal;
        target.RemoteId = source.RemoteId;
        target.RemoteParentId = source.RemoteParentId;
        target.Status = source.Status;
        target.Started = source.Started;
        target.Completed = source.Completed;
        target.Due = source.Due;
        target.InitializeMetadataSuggestions(
            source.TagSuggestions.Select(static item => item.Name),
            _goalSuggestions);
        target.SetSelectedTags(source.GetSelectedTags());
    }

    private void FinalizeTaskLayout()
    {
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

    private static Dictionary<string, Queue<TaskItem>> BuildTitleKeyMap(IEnumerable<TaskItem> tasks)
    {
        var result = new Dictionary<string, Queue<TaskItem>>(StringComparer.Ordinal);
        string? currentParentTitle = null;

        foreach (var task in tasks)
        {
            if (string.IsNullOrWhiteSpace(task.RemoteId))
            {
                var titleKey = BuildTitleKey(task, currentParentTitle);
                if (!result.TryGetValue(titleKey, out var queue))
                {
                    queue = new Queue<TaskItem>();
                    result[titleKey] = queue;
                }

                queue.Enqueue(task);
            }

            if (!task.IsChild)
            {
                currentParentTitle = NormalizeTitle(task.Title);
            }
        }

        return result;
    }

    private static string BuildTitleKey(TaskItem task, string? currentParentTitle)
    {
        var normalizedTitle = NormalizeTitle(task.Title);
        if (task.IsChild)
        {
            return $"{currentParentTitle ?? string.Empty}__{normalizedTitle}";
        }

        return normalizedTitle;
    }

    private static string NormalizeTitle(string? title)
    {
        return string.IsNullOrWhiteSpace(title) ? string.Empty : title.Trim();
    }
}

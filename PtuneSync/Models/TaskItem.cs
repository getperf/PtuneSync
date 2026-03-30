// File: Models/TaskItem.cs
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using Microsoft.UI.Xaml;

namespace PtuneSync.Models;

public class TaskItem : INotifyPropertyChanged
{
    private string _title = string.Empty;
    private bool _isChild;
    private int _plannedPomodoroCount;
    private string? _goal;
    private int _goalSuggestionIndex = -1;

    public event PropertyChangedEventHandler? PropertyChanged;

    private bool _isInitializing = true;
    public bool IsInitializing
    {
        get => _isInitializing;
        set
        {
            if (_isInitializing == value) return;
            _isInitializing = value;
            OnPropertyChanged();
        }
    }

    private int _index;
    public int Index
    {
        get => _index;
        set
        {
            if (_index == value) return;
            _index = value;

            OnPropertyChanged();
            OnPropertyChanged(nameof(IsToggleEnabled));
            OnPropertyChanged(nameof(Indent));
        }
    }

    public string Title
    {
        get => _title;
        set
        {
            if (_title == value) return;
            _title = value;
            OnPropertyChanged();
        }
    }

    public string? RemoteId { get; set; }

    public string? RemoteParentId { get; set; }

    public string Status { get; set; } = "needsAction";

    public string? Started { get; set; }

    public string? Completed { get; set; }

    public string? Due { get; set; }

    // ★ 初期化中は 1 行目ガード無効化
    public bool IsChild
    {
        get => _isChild;
        set
        {
            if (!IsInitializing && Index == 0)
                return;

            if (_isChild == value) return;

            _isChild = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(Indent));
        }
    }

    // ★ setter をバイパスして強制変更する（削除時 1 行目補正）
    public void ForceSetIsChild(bool value)
    {
        _isChild = value;
        OnPropertyChanged(nameof(IsChild));
        OnPropertyChanged(nameof(Indent));
    }

    public int PlannedPomodoroCount
    {
        get => _plannedPomodoroCount;
        set
        {
            if (_plannedPomodoroCount == value) return;
            _plannedPomodoroCount = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(PomodoroLabel));
        }
    }

    public string PomodoroLabel =>
        PlannedPomodoroCount == 0 ? "" : $"🍅x{PlannedPomodoroCount}";

    public Thickness Indent =>
        new Thickness(IsChild ? 24 : 0, 0, 0, 0);

    public bool IsToggleEnabled => Index != 0;

    public ObservableCollection<TagSuggestionItem> TagSuggestions { get; } = new();

    public IReadOnlyList<string> GoalSuggestions { get; private set; } = System.Array.Empty<string>();

    public string? Goal
    {
        get => _goal;
        set
        {
            if (_goal == value) return;
            _goal = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(GoalLabel));
        }
    }

    public string GoalLabel =>
        string.IsNullOrWhiteSpace(Goal) ? "Goal" : $"Goal: {Goal}";

    public void InitializeMetadataSuggestions(IEnumerable<string> tagSuggestions, IEnumerable<string> goalSuggestions)
    {
        TagSuggestions.Clear();
        foreach (var tag in tagSuggestions.Where(static tag => !string.IsNullOrWhiteSpace(tag)))
        {
            TagSuggestions.Add(new TagSuggestionItem(tag.Trim()));
        }

        GoalSuggestions = goalSuggestions
            .Where(static goal => !string.IsNullOrWhiteSpace(goal))
            .Select(static goal => goal.Trim())
            .Distinct()
            .ToList();

        _goalSuggestionIndex = string.IsNullOrWhiteSpace(Goal)
            ? -1
            : GoalSuggestions.ToList().IndexOf(Goal);

        OnPropertyChanged(nameof(GoalSuggestions));
    }

    public void ToggleTag(string tag)
    {
        var item = TagSuggestions.FirstOrDefault(option => option.Name == tag);
        if (item is null)
            return;

        item.IsSelected = !item.IsSelected;
    }

    public IReadOnlyList<string> GetSelectedTags()
    {
        return TagSuggestions
            .Where(static option => option.IsSelected)
            .Select(static option => option.Name)
            .ToList();
    }

    public void SetSelectedTags(IEnumerable<string>? tags)
    {
        var selected = new HashSet<string>(
            tags?.Where(static tag => !string.IsNullOrWhiteSpace(tag))
                .Select(static tag => tag.Trim())
                ?? Enumerable.Empty<string>(),
            System.StringComparer.Ordinal);

        foreach (var item in TagSuggestions)
        {
            item.IsSelected = selected.Contains(item.Name);
        }
    }

    public void CycleGoal()
    {
        if (GoalSuggestions.Count == 0)
        {
            Goal = null;
            _goalSuggestionIndex = -1;
            return;
        }

        _goalSuggestionIndex++;
        if (_goalSuggestionIndex >= GoalSuggestions.Count)
        {
            _goalSuggestionIndex = -1;
            Goal = null;
            return;
        }

        Goal = GoalSuggestions[_goalSuggestionIndex];
    }

    public void IncrementPomodoro(int max = 5)
    {
        PlannedPomodoroCount++;
        if (PlannedPomodoroCount > max)
            PlannedPomodoroCount = 0;

        OnPropertyChanged(nameof(PlannedPomodoroCount));
        OnPropertyChanged(nameof(PomodoroLabel));
    }

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}

public sealed class TagSuggestionItem : INotifyPropertyChanged
{
    private bool _isSelected;

    public TagSuggestionItem(string name)
    {
        Name = name;
    }

    public string Name { get; }
    public string DisplayName => $"#{Name}";

    public bool IsSelected
    {
        get => _isSelected;
        set
        {
            if (_isSelected == value) return;
            _isSelected = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsSelected)));
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;
}

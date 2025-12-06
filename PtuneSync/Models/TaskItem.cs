// File: Models/TaskItem.cs
using System.ComponentModel;
using System.Runtime.CompilerServices;
using Microsoft.UI.Xaml;
using PtuneSync.Infrastructure;

namespace PtuneSync.Models;

public class TaskItem : INotifyPropertyChanged
{
    private string _title = string.Empty;
    private bool _isChild;
    private int _plannedPomodoroCount;

    // ★ 初期化中フラグ（初期値 true）
    public bool IsInitializing { get; set; } = true;

    public event PropertyChangedEventHandler? PropertyChanged;

    // 行番号
    private int _index;
    public int Index
    {
        get => _index;
        set
        {
            if (_index == value) return;

            AppLog.Debug("[TaskItem] Index changed: {0} → {1}, Title={2}", _index, value, Title);

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

            AppLog.Debug("[TaskItem] Title changed: {0} → {1}", _title, value);

            _title = value;
            OnPropertyChanged();
        }
    }

    // ★ 1行目は通常は親タスク固定。ただし初期化中は許可。
    public bool IsChild
    {
        get => _isChild;
        set
        {
            AppLog.Debug("[TaskItem] IsChild setter called: Title={0}, Old={1}, New={2}, Index={3}, Init={4}",
                Title, _isChild, value, Index, IsInitializing);

            // ★ 初期化中に限り Index=0 でも変更 OK
            if (!IsInitializing)
            {
                if (Index == 0)
                {
                    AppLog.Debug("[TaskItem] IsChild change BLOCKED (first row): Title={0}", Title);
                    return;
                }
            }

            if (_isChild == value) return;

            _isChild = value;
            AppLog.Debug("[TaskItem] IsChild updated: Title={0}, Now={1}", Title, _isChild);

            OnPropertyChanged();
            OnPropertyChanged(nameof(Indent));
        }
    }

    public int PlannedPomodoroCount
    {
        get => _plannedPomodoroCount;
        set
        {
            if (_plannedPomodoroCount == value) return;

            AppLog.Debug("[TaskItem] Pomodoro changed: {0} → {1}, Title={2}",
                _plannedPomodoroCount, value, Title);

            _plannedPomodoroCount = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(PomodoroLabel));
        }
    }

    public string PomodoroLabel =>
        PlannedPomodoroCount == 0 ? "" : $"🍅x{PlannedPomodoroCount}";

    public Thickness Indent => new Thickness(IsChild ? 24 : 0, 0, 0, 0);

    public bool IsToggleEnabled => Index != 0;

    public void IncrementPomodoro(int max = 5)
    {
        PlannedPomodoroCount++;
        if (PlannedPomodoroCount > max)
            PlannedPomodoroCount = 0;

        AppLog.Debug("[TaskItem] IncrementPomodoro: Title={0}, New={1}",
            Title, PlannedPomodoroCount);

        OnPropertyChanged(nameof(PlannedPomodoroCount));
        OnPropertyChanged(nameof(PomodoroLabel));
    }

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
    {
        AppLog.Debug("[TaskItem] PropertyChanged fired: {0}, Title={1}", name, Title);
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }
}

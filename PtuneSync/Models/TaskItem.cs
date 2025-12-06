// File: Models/TaskItem.cs
using System.ComponentModel;
using System.Runtime.CompilerServices;
using Microsoft.UI.Xaml;

namespace PtuneSync.Models;

public class TaskItem : INotifyPropertyChanged
{
    private string _title = string.Empty;
    private bool _isChild;
    private int _plannedPomodoroCount;

    public event PropertyChangedEventHandler? PropertyChanged;

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

    public bool IsChild
    {
        get => _isChild;
        set
        {
            if (_isChild == value) return;
            _isChild = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(Indent));
        }
    }

    // 0 のときはポモドーロ未設定
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

    // UI 表示用（0 → ""）
    public string PomodoroLabel =>
        PlannedPomodoroCount == 0 ? "" : $"🍅x{PlannedPomodoroCount}";

    // 子タスクは左インデント
    public Thickness Indent => new Thickness(IsChild ? 24 : 0, 0, 0, 0);

    // 0 → 1 → 2 → 3 → … → 0 と循環
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

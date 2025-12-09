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

// File: Models/TaskItem.cs
using System.ComponentModel;
using System.Runtime.CompilerServices;
using Microsoft.UI.Xaml;

namespace PtuneSync.Models;

public class TaskItem : INotifyPropertyChanged
{
    private string _title = string.Empty;
    private bool _isChild;

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
            OnPropertyChanged(nameof(TitleWidth));
        }
    }

    // 子タスクは左にインデント
    public Thickness Indent => new Thickness(IsChild ? 24 : 0, 0, 0, 0);

    // 親と子で TextBox の幅を変える（右端を揃える）
    public double TitleWidth => IsChild ? 220 : 260;

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}

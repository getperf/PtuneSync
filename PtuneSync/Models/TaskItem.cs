// File: Models/TaskItem.cs
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace PtuneSync.Models;

public class TaskItem : INotifyPropertyChanged
{
    private string _title = string.Empty;

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

    private void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}

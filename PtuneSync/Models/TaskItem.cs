// File: PtuneSync/Models/TaskItem.cs
namespace PtuneSync.Models;

public class TaskItem
{
    public string Title { get; set; } = "";
    public int Pomodoro { get; set; }
    public bool IsChild { get; set; } // true = 子タスク
}

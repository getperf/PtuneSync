// File: Views/TaskEditorView.xaml.cs
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PtuneSync.Models;
using PtuneSync.Infrastructure;

namespace PtuneSync.Views;

public sealed partial class TaskEditorView : UserControl
{
    public TaskEditorView()
    {
        InitializeComponent();
    }

    // 🍅xN インクリメント
    private void OnIncrementPomodoroClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            item.IncrementPomodoro(5);
            AppLog.Info($"[UI] Increment - Title: {item.Title}, Row: {item.Index}, Pomodoro: {item.PlannedPomodoroCount}");
        }
        else
        {
            AppLog.Warn("[UI] Increment handler: TaskItem not found in DataContext");
        }
    }

    // 親/子切替（1行目は無効）
    private void OnToggleHierarchyClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            if (item.Index == 0)
            {
                AppLog.Info("[UI] First row toggle ignored (always parent)");
                return;
            }

            item.IsChild = !item.IsChild;
            AppLog.Info($"[UI] Toggle hierarchy - Title: {item.Title}, Row: {item.Index}, IsChild: {item.IsChild}");
        }
        else
        {
            AppLog.Warn("[UI] Toggle handler: TaskItem not found in DataContext");
        }
    }
}

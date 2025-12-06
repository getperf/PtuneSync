// File: Views/TaskEditorView.xaml.cs
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PtuneSync.Models;
using PtuneSync.Infrastructure;  // ← 重要：AppLog を使う場合

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
        AppLog.Info("[UI] Increment button clicked");

        if (sender is Button btn2)
            AppLog.Info($"[UI] sender={btn2.GetType().Name}, DataContext={btn2.DataContext}");

        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            AppLog.Info($"[UI] Increment before: {item.PlannedPomodoroCount}");
            item.IncrementPomodoro(5);
            AppLog.Info($"[UI] Increment after: {item.PlannedPomodoroCount}");
        }
        else
        {
            AppLog.Warn("[UI] Increment handler: TaskItem not found in DataContext");
        }
    }

    // 親/子切替
    private void OnToggleHierarchyClicked(object sender, RoutedEventArgs e)
    {
        AppLog.Info("[UI] ToggleHierarchy clicked");

        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            AppLog.Info($"[UI] Toggle before: IsChild={item.IsChild}");
            item.IsChild = !item.IsChild;
            AppLog.Info($"[UI] Toggle after: IsChild={item.IsChild}");
        }
        else
        {
            AppLog.Warn("[UI] Toggle handler: TaskItem not found in DataContext");
        }
    }
}

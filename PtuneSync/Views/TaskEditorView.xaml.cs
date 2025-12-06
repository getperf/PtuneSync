// File: Views/TaskEditorView.xaml.cs
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PtuneSync.Models;
using PtuneSync.Infrastructure;
using PtuneSync.ViewModels;

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
            AppLog.Info("[UI] Increment: {0}", item.Title);
            item.IncrementPomodoro(5);
        }
    }

    // 親/子切替
    private void OnToggleHierarchyClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            AppLog.Info("[UI] ToggleHierarchy: {0}", item.Title);
            item.IsChild = !item.IsChild;
        }
    }

    private void OnAddTaskClicked(object sender, RoutedEventArgs e)
    {
        AppLog.Info("[UI] AddTask clicked");

        if (DataContext is TaskEditorViewModel vm)
        {
            var newTask = vm.AddTask();
            AppLog.Info("[UI] Added new task: Index={0}, IsChild={1}",
                newTask.Index, newTask.IsChild);
        }
    }
    
    // 削除処理
    private void OnDeleteTaskClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            AppLog.Info("[UI] Delete clicked: {0}", item.Title);

            if (DataContext is TaskEditorViewModel vm)
            {
                vm.DeleteTask(item);
            }
        }
    }
}

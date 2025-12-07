// File: Views/TaskEditorView.xaml.cs
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Input;
using PtuneSync.Models;
using PtuneSync.ViewModels;
using PtuneSync.Infrastructure;
using System.Threading.Tasks;
using Microsoft.UI.Input;
using Windows.UI.Core;

namespace PtuneSync.Views;

public sealed partial class TaskEditorView : UserControl
{
    public TaskEditorView()
    {
        InitializeComponent();
        AppLog.Debug("[TaskEditorView] DataContext=" + (this.DataContext?.GetType().Name ?? "null"));
        AppLog.Debug("[TaskEditorView] Actual DataContext type = " + this.DataContext?.GetType().AssemblyQualifiedName);
    }

    // Shift + Enter でタスク追加
    private void OnViewKeyDown(object sender, KeyRoutedEventArgs e)
    {
        // Shift + Enter 判定
        bool isShift =
            (InputKeyboardSource.GetKeyStateForCurrentThread(Windows.System.VirtualKey.Shift)
                & CoreVirtualKeyStates.Down) != 0;

        if (e.Key == Windows.System.VirtualKey.Enter && isShift)
        {
            e.Handled = true;
            AppLog.Info("[UI] Shift+Enter detected (global)");

            if (DataContext is TaskEditorViewModel vm)
            {
                var newTask = vm.AddTask();
                _ = FocusNewTaskAsync(newTask);
            }
        }
    }

    // 新タスクの TextBox にフォーカス
    private async Task FocusNewTaskAsync(TaskItem newTask)
    {
        await Task.Delay(50);

        var container = TaskListView.ContainerFromItem(newTask) as ListViewItem;

        if (container == null)
        {
            await Task.Delay(100);
            container = TaskListView.ContainerFromItem(newTask) as ListViewItem;
        }

        if (container == null)
        {
            AppLog.Warn("[UI] Could not resolve ListViewItem for new task.");
            return;
        }

        var textBox = FindDescendant<TextBox>(container);
        textBox?.Focus(FocusState.Programmatic);
    }

    // VisualTree 再帰検索
    private static T? FindDescendant<T>(DependencyObject root) where T : DependencyObject
    {
        int count = VisualTreeHelper.GetChildrenCount(root);
        for (int i = 0; i < count; i++)
        {
            var child = VisualTreeHelper.GetChild(root, i);
            if (child is T t)
                return t;

            var result = FindDescendant<T>(child);
            if (result != null)
                return result;
        }
        return null;
    }

    // ポモドーロ数インクリメント

    private void OnIncrementPomodoroClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            AppLog.Info("[UI] Increment: {0}", item.Title);
            item.IncrementPomodoro(5);
        }
    }

    // 親子トグル

    private void OnToggleHierarchyClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            AppLog.Info("[UI] ToggleHierarchy: {0}", item.Title);
            item.IsChild = !item.IsChild;
        }
    }

    // タスク削除
    private void OnDeleteTaskClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            if (DataContext is TaskEditorViewModel vm)
            {
                AppLog.Info("[UI] Delete clicked: {0}", item.Title);
                vm.DeleteTask(item);
            }
        }
    }

    // タスク追加
    private async void OnAddTaskClicked(object sender, RoutedEventArgs e)
    {
        if (DataContext is not TaskEditorViewModel vm)
            return;

        var newTask = vm.AddTask();
        await FocusNewTaskAsync(newTask);
    }
}

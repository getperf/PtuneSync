// File: Views/TaskEditorView.xaml.cs
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PtuneSync.Models;

namespace PtuneSync.Views;

public sealed partial class TaskEditorView : UserControl
{
    public TaskEditorView()
    {
        InitializeComponent();
    }

    private void OnToggleHierarchyClicked(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.DataContext is TaskItem item)
        {
            item.IsChild = !item.IsChild;
        }
    }
}

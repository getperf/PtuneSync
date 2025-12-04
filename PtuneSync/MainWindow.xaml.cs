// File: PtuneSync/MainWindow.xaml.cs
using Microsoft.UI.Xaml;
using PtuneSync.ViewModels;
using System.IO;
using PtuneSync.Infrastructure;

namespace PtuneSync;

public sealed partial class MainWindow : Window
{
    public TaskEditorViewModel ViewModel { get; private set; } = null!;

    public MainWindow()
    {
        InitializeComponent();
        this.AppWindow.Resize(new Windows.Graphics.SizeInt32(900, 600));
    }

    // GUI モード専用初期化
    public void InitializeViewModelForUI()
    {
        ViewModel = new TaskEditorViewModel();

        if (this.Content is FrameworkElement root)
        {
            root.DataContext = ViewModel;
        }
    }

    private void OnAddParentTaskClicked(object sender, RoutedEventArgs e)
        => ViewModel.AddParentTask();

    private void OnAddChildTaskClicked(object sender, RoutedEventArgs e)
        => ViewModel.AddChildTask();

    private async void OnExportClicked(object sender, RoutedEventArgs e)
    {
        var md = ViewModel.BuildMarkdown();
        var tmp = Path.Combine(Path.GetTempPath(), "tasks_ui.md");

        await File.WriteAllLinesAsync(tmp, md);

        // ★ AppLog は PtuneSync.Infrastructure に入っている
        AppLog.Info("[MainWindow] Export mock saved: {0}", tmp);
    }
}

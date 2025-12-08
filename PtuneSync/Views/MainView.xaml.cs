using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PtuneSync.Infrastructure;
using PtuneSync.ViewModels;

namespace PtuneSync.Views
{
    public sealed partial class MainView : UserControl
    {
        private readonly MainViewModel _viewModel;

        public MainView()
        {
            InitializeComponent();
            AppLog.Debug("[MainView] Constructed");

            // ★ ViewModel は一度だけ生成
            _viewModel = new MainViewModel();

            // ★ MainView 全体の DataContext を設定
            RootGrid.DataContext = _viewModel;

            // ★ TaskEditorHost の DataContext を Editor にセット
            TaskEditorHost.DataContext = _viewModel.Editor;

            AppLog.Debug("[MainView] TaskEditorHost.DataContext=" +
                (TaskEditorHost.DataContext?.GetType().Name ?? "null"));

            InitializeSettingsMenu(_viewModel);
        }

        private void InitializeSettingsMenu(MainViewModel vm)
        {
            var flyout = new MenuFlyout();

            flyout.Items.Add(new MenuFlyoutItem
            {
                Text = "再認証",
                Command = vm.ReauthenticateCommand
            });

            flyout.Items.Add(new MenuFlyoutItem
            {
                Text = "ログフォルダを開く",
                Command = vm.OpenLogFolderCommand
            });

            flyout.Items.Add(new MenuFlyoutSeparator());

            flyout.Items.Add(new MenuFlyoutItem
            {
                Text = "バージョン情報",
                Command = vm.ShowVersionCommand
            });

            SettingsButton.Flyout = flyout;
        }
    }
}

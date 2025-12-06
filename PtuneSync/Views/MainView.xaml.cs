using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PtuneSync.ViewModels;

namespace PtuneSync.Views
{
    public sealed partial class MainView : UserControl
    {
        public MainView()
        {
            InitializeComponent();
            RootGrid.DataContext = new MainViewModel();
            InitializeSettingsMenu();
        }

        private void InitializeSettingsMenu()
        {
            var vm = RootGrid.DataContext as MainViewModel;
            var flyout = new MenuFlyout();

            flyout.Items.Add(new MenuFlyoutItem
            {
                Text = "サインアウト",
                Command = vm?.SignOutCommand
            });

            flyout.Items.Add(new MenuFlyoutItem
            {
                Text = "ログフォルダを開く",
                Command = vm?.OpenLogFolderCommand
            });

            flyout.Items.Add(new MenuFlyoutSeparator());

            flyout.Items.Add(new MenuFlyoutItem
            {
                Text = "バージョン情報",
                Command = vm?.ShowVersionCommand
            });

            SettingsButton.Flyout = flyout;
        }
    }
}

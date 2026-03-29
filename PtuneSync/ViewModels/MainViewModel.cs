using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI;
using Microsoft.UI.Xaml.Media;
using PtuneSync.Infrastructure;
using PtuneSync.Services;
using System;
using System.Linq;
using System.Threading.Tasks;
using PtuneSync.ViewModels;

namespace PtuneSync.ViewModels
{
    public enum SyncMode
    {
        Planning,
        Working,
    }

    public partial class MainViewModel : ObservableObject
    {
        private readonly ExportService _exportService;
        private readonly ResetService _resetService;
        private readonly ReauthService _reauthService;
        private readonly SystemOpenerService _opener;
        private readonly DatabaseSettingsDialogService _databaseSettingsDialogService;

        public TaskEditorViewModel Editor { get; } = new TaskEditorViewModel();

        private string _statusMessage = AppStrings.Ready;
        private SyncMode _currentSyncMode;

        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        public SyncMode CurrentSyncMode
        {
            get => _currentSyncMode;
            private set
            {
                if (SetProperty(ref _currentSyncMode, value))
                {
                    OnPropertyChanged(nameof(SyncModeLabel));
                    OnPropertyChanged(nameof(SyncModeDescription));
                    OnPropertyChanged(nameof(SyncModeInlineText));
                    OnPropertyChanged(nameof(SyncModeBrush));
                    OnPropertyChanged(nameof(PushButtonBrush));
                }
            }
        }

        public string SyncModeLabel =>
            CurrentSyncMode == SyncMode.Planning
                ? AppStrings.SyncModePlanningLabel
                : AppStrings.SyncModeWorkingLabel;

        public string SyncModeDescription =>
            CurrentSyncMode == SyncMode.Planning
                ? AppStrings.SyncModePlanningDescription
                : AppStrings.SyncModeWorkingDescription;

        public string SyncModeInlineText => $"{SyncModeLabel} | {SyncModeDescription}";

        public Brush SyncModeBrush =>
            CurrentSyncMode == SyncMode.Planning
                ? new SolidColorBrush(ColorHelper.FromArgb(255, 0x1D, 0x6F, 0xC9))
                : new SolidColorBrush(ColorHelper.FromArgb(255, 0x22, 0x8B, 0x57));

        public Brush PushButtonBrush => SyncModeBrush;

        public MainViewModel()
        {
            _exportService = new ExportService();
            _resetService = new ResetService();
            _reauthService = new ReauthService();
            _opener = new SystemOpenerService();
            _databaseSettingsDialogService = new DatabaseSettingsDialogService();
            RefreshSyncMode();
        }

        private static string TodayLocalDate() => DateTime.Now.ToString("yyyy-MM-dd");

        private void RefreshSyncMode()
        {
            CurrentSyncMode = AppConfigManager.Config.OtherSettings.LastSuccessfulPushDate == TodayLocalDate()
                ? SyncMode.Working
                : SyncMode.Planning;
        }

        // ★ Export コマンドで Editor.Tasks を利用
        [RelayCommand]
        private async Task ExportAsync()
        {
            StatusMessage = AppStrings.Exporting;

            var result = await _exportService.ExecuteAsync(Editor.Tasks);

            StatusMessage = result.Success
                ? AppStrings.ExportCompleted
                : $"失敗: {result.Message}";
        }

        [RelayCommand]
        private async Task ResetAsync()
        {
            AppLog.Debug("[MainViewModel] ResetAsync invoked");

            StatusMessage = AppStrings.Resetting;
            await Task.Delay(200);

            await _resetService.ExecuteAsync();
            AppConfigManager.Config.OtherSettings.LastSuccessfulPushDate = null;
            AppConfigManager.Save();
            RefreshSyncMode();
            StatusMessage = AppStrings.ResetCompleted;

            AppLog.Debug("[MainViewModel] ResetAsync completed");
        }

        [RelayCommand]
        private Task PullAsync()
        {
            StatusMessage = AppStrings.PullCompleted;
            return Task.CompletedTask;
        }

        [RelayCommand]
        private Task PushAsync()
        {
            AppConfigManager.Config.OtherSettings.LastSuccessfulPushDate = TodayLocalDate();
            AppConfigManager.Save();
            RefreshSyncMode();
            StatusMessage = AppStrings.PushCompleted;
            return Task.CompletedTask;
        }

        [RelayCommand]
        private async Task ReauthenticateAsync()
        {
            StatusMessage = AppStrings.ReauthStarting;
            AppLog.Debug("[MainViewModel] ReauthenticateAsync invoked");

            var result = await _reauthService.ExecuteAsync();

            StatusMessage = result.Success
                ? AppStrings.ReauthCompleted
                : $"再認証に失敗しました: {result.Message}";
        }

        [RelayCommand]
        private async Task OpenLogFolder()
        {
            StatusMessage = AppStrings.OpeningLogFolder;

            bool ok = await _opener.OpenLogFolderAsync();

            StatusMessage = ok
                ? AppStrings.OpenedLogFolder
                : AppStrings.FailedToOpenLogFolder;
        }

        [RelayCommand]
        private async Task ShowVersion()
        {
            var version = VersionService.GetAppVersion();

            var msg =
                $"PtuneSync GUI バージョン\n" +
                $"--------------------------------\n" +
                $"Version : {version}\n" +
                $"Build    : GUI / WinUI3\n" +
                $"--------------------------------";

            await new UserDialogService().ShowMessageAsync(msg, AppStrings.VersionInfoTitle);

            StatusMessage = $"PtuneSync v{version}";
        }

        [RelayCommand]
        private async Task ShowDatabaseSettings()
        {
            var result = await _databaseSettingsDialogService.ShowAsync();
            if (!result.Saved)
            {
                StatusMessage = AppStrings.DatabaseSettingsUnchanged;
                return;
            }

            AppConfigManager.Config.Database.LocationMode = result.SelectedMode;
            AppConfigManager.Config.TaskMetadata.TagSuggestions = result.TagSuggestions.ToList();
            AppConfigManager.Config.TaskMetadata.GoalSuggestions = result.GoalSuggestions.ToList();
            AppConfigManager.Save();
            Editor.ReloadSuggestions();
            RefreshSyncMode();
            StatusMessage = AppStrings.DatabaseSettingsSaved;
        }
    }
}

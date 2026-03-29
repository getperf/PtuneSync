using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PtuneSync.Infrastructure;
using PtuneSync.Services;
using System.Linq;
using System.Threading.Tasks;
using PtuneSync.ViewModels;

namespace PtuneSync.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly ExportService _exportService;
        private readonly ResetService _resetService;
        private readonly ReauthService _reauthService;
        private readonly SystemOpenerService _opener;
        private readonly DatabaseSettingsDialogService _databaseSettingsDialogService;

        public TaskEditorViewModel Editor { get; } = new TaskEditorViewModel();

        private string _statusMessage = AppStrings.Ready;

        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        public MainViewModel()
        {
            _exportService = new ExportService();
            _resetService = new ResetService();
            _reauthService = new ReauthService();
            _opener = new SystemOpenerService();
            _databaseSettingsDialogService = new DatabaseSettingsDialogService();
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
            StatusMessage = AppStrings.ResetCompleted;

            AppLog.Debug("[MainViewModel] ResetAsync completed");
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
            StatusMessage = AppStrings.DatabaseSettingsSaved;
        }
    }
}

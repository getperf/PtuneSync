using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI;
using Microsoft.UI.Xaml.Media;
using PtuneSync.Infrastructure;
using PtuneSync.GoogleTasks;
using PtuneSync.Protocol;
using PtuneSync.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PtuneSync.ViewModels
{
    public enum SyncMode
    {
        Planning,
        Working,
    }

    public partial class MainViewModel : ObservableObject
    {
        private readonly ResetService _resetService;
        private readonly ReauthService _reauthService;
        private readonly SystemOpenerService _opener;
        private readonly DatabaseSettingsDialogService _databaseSettingsDialogService;
        private readonly PullCommandService _pullCommandService;
        private readonly DiffCommandService _diffCommandService;
        private readonly PushCommandService _pushCommandService;
        private readonly TaskEditorSyncDocumentService _taskEditorSyncDocumentService;
        private readonly UserDialogService _dialogService;
        private readonly ReviewReportDialogService _reviewReportDialogService;
        private string _currentListName = GoogleTasksAPI.DefaultTodayListName;

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
            _resetService = new ResetService();
            _reauthService = new ReauthService();
            _opener = new SystemOpenerService();
            _databaseSettingsDialogService = new DatabaseSettingsDialogService();
            _pullCommandService = new PullCommandService();
            _diffCommandService = new DiffCommandService();
            _pushCommandService = new PushCommandService();
            _taskEditorSyncDocumentService = new TaskEditorSyncDocumentService();
            _dialogService = new UserDialogService();
            _reviewReportDialogService = new ReviewReportDialogService();
            RefreshSyncMode();
        }

        private static string TodayLocalDate() => DateTime.Now.ToString("yyyy-MM-dd");

        private void RefreshSyncMode()
        {
            CurrentSyncMode = AppConfigManager.Config.OtherSettings.LastSuccessfulPushDate == TodayLocalDate()
                ? SyncMode.Working
                : SyncMode.Planning;
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
        private async Task PullAsync()
        {
            StatusMessage = AppStrings.Pulling;

            try
            {
                var includeCompleted = CurrentSyncMode == SyncMode.Working;
                var result = await _pullCommandService.ExecuteAsync(BuildPullRequest(includeCompleted));
                _currentListName = result.ListName;
                ApplyPullResult(result.ResponseTasks);
                StatusMessage = $"Pull 完了: {result.ResponseTasks.Count} 件";
            }
            catch (Exception ex)
            {
                StatusMessage = $"Pull に失敗しました: {ex.Message}";
            }
        }

        [RelayCommand]
        private async Task PushAsync()
        {
            if (Editor.Tasks.Count == 0)
            {
                StatusMessage = "Push 対象のタスクがありません";
                return;
            }

            try
            {
                StatusMessage = AppStrings.PushPreparing;

                var taskJsonFile = await _taskEditorSyncDocumentService.WriteTaskJsonAsync(Editor.Tasks);
                var allowDelete = CurrentSyncMode == SyncMode.Planning;
                var diffRequest = BuildDiffOrPushRequest(taskJsonFile, allowDelete);
                var diff = await _diffCommandService.ExecuteAsync(diffRequest);

                var confirmed = await _dialogService.ConfirmDiffAsync(diff, allowDelete);
                if (!confirmed)
                {
                    StatusMessage = diff.Summary.Errors > 0
                        ? "Diff エラーのため Push を中止しました"
                        : "Push をキャンセルしました";
                    return;
                }

                StatusMessage = AppStrings.PushRunning;
                await _pushCommandService.ExecuteAsync(diffRequest);

                AppConfigManager.Config.OtherSettings.LastSuccessfulPushDate = TodayLocalDate();
                AppConfigManager.Save();
                RefreshSyncMode();

                var refreshed = await _pullCommandService.ExecuteAsync(BuildPullRequest(CurrentSyncMode == SyncMode.Working));
                _currentListName = refreshed.ListName;
                ApplyPullResult(refreshed.ResponseTasks);

                StatusMessage = $"Push 完了: +{diff.Summary.Create} / ~{diff.Summary.Update} / -{diff.Summary.Delete}";
            }
            catch (Exception ex)
            {
                StatusMessage = $"Push に失敗しました: {ex.Message}";
            }
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

        [RelayCommand]
        private async Task ShowReviewReport()
        {
            try
            {
                await _reviewReportDialogService.ShowAsync(_currentListName);
                StatusMessage = "振り返りレポートを表示しました";
            }
            catch (Exception ex)
            {
                StatusMessage = $"振り返りレポートの表示に失敗しました: {ex.Message}";
            }
        }

        private RunRequestFile BuildPullRequest(bool includeCompleted)
        {
            return new RunRequestFile
            {
                Home = AppPaths.VaultHome,
                Args = new RunRequestArgs
                {
                    List = _currentListName,
                    IncludeCompleted = includeCompleted,
                },
            };
        }

        private void ApplyPullResult(System.Collections.Generic.IReadOnlyCollection<Models.MyTask> tasks)
        {
            if (CurrentSyncMode == SyncMode.Working)
            {
                Editor.MergeFromMyTasks(tasks);
                return;
            }

            Editor.LoadFromMyTasks(tasks);
        }

        private RunRequestFile BuildDiffOrPushRequest(string taskJsonFile, bool allowDelete)
        {
            return new RunRequestFile
            {
                Home = AppPaths.VaultHome,
                Input = new RunRequestInput
                {
                    TaskJsonFile = taskJsonFile,
                },
                Args = new RunRequestArgs
                {
                    List = _currentListName,
                    AllowDelete = allowDelete,
                },
            };
        }
    }
}

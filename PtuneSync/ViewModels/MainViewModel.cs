using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PtuneSync.Infrastructure;
using PtuneSync.Services;
using Serilog;
using System.Threading.Tasks;

namespace PtuneSync.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly ExportService _exportService;
        private readonly ResetService _resetService;
        private readonly AuthService _authService;

        [ObservableProperty]
        private string statusMessage = "準備完了";

        public MainViewModel()
        {
            _exportService = new ExportService();
            _resetService = new ResetService();
            _authService = new AuthService();
        }

        [RelayCommand]
        private async Task ExportAsync()
        {
            StatusMessage = "エクスポート中…";
            await Task.Delay(200);
            await _exportService.ExecuteAsync();
            StatusMessage = "エクスポート完了（スケルトン）";
        }

        [RelayCommand]
        private async Task ResetAsync()
        {
            AppLog.Debug("[MainViewModel] ResetAsync invoked");

            StatusMessage = "リセット中…";
            await Task.Delay(200);

            await _resetService.ExecuteAsync();

            StatusMessage = "タスクをすべてリセットしました";

            AppLog.Debug("[MainViewModel] ResetAsync completed");
        }

        [RelayCommand]
        private async Task SignOutAsync()
        {
            StatusMessage = "サインアウト中…";
            await Task.Delay(200);
            await _authService.SignOutAsync();
            StatusMessage = "サインアウト完了";
        }

        [RelayCommand]
        private void OpenLogFolder()
        {
            StatusMessage = "ログフォルダを開く（スケルトン）";
        }

        [RelayCommand]
        private void ShowVersion()
        {
            StatusMessage = "PtuneSync v1.0.0（スケルトン）";
        }
    }
}

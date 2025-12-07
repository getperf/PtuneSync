using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PtuneSync.Infrastructure;
using PtuneSync.Services;
using System.Threading.Tasks;

namespace PtuneSync.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly ExportService _exportService;
        private readonly ResetService _resetService;
        private readonly ReauthService _reauthService;

        private string _statusMessage = "準備完了";

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

        // ★★★ ReAuth コマンド（旧 SignOut コマンド置き換え）
        [RelayCommand]
        private async Task ReauthenticateAsync()
        {
            StatusMessage = "再認証を開始します…";
            AppLog.Debug("[MainViewModel] ReauthenticateAsync invoked");

            var result = await _reauthService.ExecuteAsync(); // ← result を返すように修正済み

            StatusMessage = result.Success
                ? "再認証が完了しました"
                : $"再認証に失敗しました: {result.Message}";
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

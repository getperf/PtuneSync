namespace PtuneSync.Infrastructure;

public static class AppStrings
{
    public static string Ready => "準備完了";
    public static string Exporting => "エクスポート中…";
    public static string ExportCompleted => "エクスポート完了";
    public static string Resetting => "リセット中…";
    public static string ResetCompleted => "タスクをすべてリセットしました";
    public static string ReauthStarting => "再認証を開始します…";
    public static string ReauthCompleted => "再認証が完了しました";
    public static string OpeningLogFolder => "ログフォルダを開いています…";
    public static string OpenedLogFolder => "ログフォルダを開きました";
    public static string FailedToOpenLogFolder => "ログフォルダを開けませんでした";
    public static string VersionInfoTitle => "バージョン情報";
    public static string DatabaseSettingsMenu => "データベース設定";
    public static string ReauthenticateMenu => "再認証";
    public static string OpenLogFolderMenu => "ログフォルダを開く";
    public static string VersionInfoMenu => "バージョン情報";
    public static string DatabaseSettingsTitle => "データベース保存先";
    public static string DatabaseSettingsPrimary => "保存";
    public static string Cancel => "キャンセル";
    public static string DatabaseSettingsSaved => "データベース設定を保存しました";
    public static string DatabaseSettingsUnchanged => "データベース設定は変更されませんでした";
    public static string DatabaseModeLabel => "保存先";
    public static string DatabaseCurrentPathLabel => "現在のデータベースパス";
    public static string DatabasePathPendingLabel => "現在のデータベースパス";
    public static string DatabaseVaultPathUnavailable => "Vault work の実パスは Vault 実行時の home パラメータから決定されます。まだ Vault コンテキストが記録されていません。";
    public static string DatabaseAppLocalOption => "App local（推奨）";
    public static string DatabaseVaultWorkOption => "Vault work";
    public static string DatabaseAppLocalDescription => "SQLite の安定運用向きです。Vault 同期の競合を避けやすくなります。";
    public static string DatabaseVaultWorkDescription => "Vault と一緒にバックアップしやすくなります。同期ツールとの競合には注意が必要です。";
    public static string DatabaseMigrationPending => "DB の初期化とコピー切替は次の実装段階で有効になります。今回は設定保存のみ行います。";
}

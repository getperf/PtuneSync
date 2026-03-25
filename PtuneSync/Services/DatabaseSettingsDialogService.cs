using System.Threading.Tasks;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Markup;
using PtuneSync.Infrastructure;

namespace PtuneSync.Services;

public sealed class DatabaseSettingsDialogService
{
    public async Task<DatabaseSettingsDialogResult> ShowAsync()
    {
        var currentMode = AppConfigManager.Config.Database.LocationMode;
        var currentPathResolved = DbPathResolver.TryResolveCurrentDisplayPath(out var currentPath);
        var appLocalPath = DbPathResolver.Resolve(DbLocationMode.AppLocal, AppConfigManager.Config.Database.LastVaultHome);
        var vaultWorkPathResolved = DbPathResolver.TryResolveDisplayPath(DbLocationMode.VaultWork, out var vaultWorkPath);

        var radioButtons = new RadioButtons
        {
            ItemsSource = new[]
            {
                new DatabaseModeOption(DbLocationMode.AppLocal, AppStrings.DatabaseAppLocalOption, AppStrings.DatabaseAppLocalDescription, appLocalPath),
                new DatabaseModeOption(DbLocationMode.VaultWork, AppStrings.DatabaseVaultWorkOption, AppStrings.DatabaseVaultWorkDescription, vaultWorkPathResolved ? vaultWorkPath! : AppStrings.DatabaseVaultPathUnavailable),
            },
            SelectedIndex = currentMode == DbLocationMode.AppLocal ? 0 : 1,
        };
        radioButtons.ItemTemplate = BuildOptionTemplate();

        var currentPathText = new TextBlock
        {
            Text = currentPathResolved ? currentPath! : AppStrings.DatabaseVaultPathUnavailable,
            TextWrapping = TextWrapping.WrapWholeWords,
            IsTextSelectionEnabled = true,
        };

        var stack = new StackPanel
        {
            Spacing = 12,
            Children =
            {
                new TextBlock { Text = AppStrings.DatabaseModeLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold },
                radioButtons,
                new InfoBar
                {
                    Severity = InfoBarSeverity.Informational,
                    IsOpen = true,
                    IsClosable = false,
                    Message = AppStrings.DatabaseMigrationPending,
                },
                new TextBlock { Text = AppStrings.DatabaseCurrentPathLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold },
                currentPathText,
            }
        };

        var dialog = new ContentDialog
        {
            Title = AppStrings.DatabaseSettingsTitle,
            Content = stack,
            PrimaryButtonText = AppStrings.DatabaseSettingsPrimary,
            CloseButtonText = AppStrings.Cancel,
        };

        var result = await DialogHost.ShowAsync(dialog);
        if (result != ContentDialogResult.Primary)
        {
            return new DatabaseSettingsDialogResult(false, currentMode);
        }

        var selected = radioButtons.SelectedItem as DatabaseModeOption;
        return new DatabaseSettingsDialogResult(true, selected?.Mode ?? currentMode);
    }

    private static DataTemplate BuildOptionTemplate()
    {
        return (DataTemplate)XamlReader.Load(
            """
            <DataTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation">
                <StackPanel Spacing="2" Margin="0,0,0,8">
                    <TextBlock Text="{Binding Label}" FontWeight="SemiBold"/>
                    <TextBlock Text="{Binding Description}" TextWrapping="WrapWholeWords" Opacity="0.85"/>
                    <TextBlock Text="{Binding Path}" TextWrapping="WrapWholeWords" Opacity="0.7" FontSize="12" IsTextSelectionEnabled="True"/>
                </StackPanel>
            </DataTemplate>
            """);
    }

    private sealed record DatabaseModeOption(DbLocationMode Mode, string Label, string Description, string Path);
}

public sealed record DatabaseSettingsDialogResult(bool Saved, DbLocationMode SelectedMode);

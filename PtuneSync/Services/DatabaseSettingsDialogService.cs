using System.Threading.Tasks;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Markup;
using System;
using System.Collections.Generic;
using System.Linq;
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

        var tagSuggestionsBox = BuildMultilineTextBox(AppConfigManager.Config.TaskMetadata.TagSuggestions);
        var goalSuggestionsBox = BuildMultilineTextBox(AppConfigManager.Config.TaskMetadata.GoalSuggestions);

        var stack = new StackPanel
        {
            Spacing = 12,
            Children =
            {
                new TextBlock { Text = AppStrings.DatabaseSectionLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold },
                new TextBlock { Text = AppStrings.DatabaseModeLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold },
                radioButtons,
                new TextBlock { Text = AppStrings.DatabaseCurrentPathLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold },
                currentPathText,
                new TextBlock { Text = AppStrings.TaskMetadataSectionLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold, Margin = new Thickness(0, 12, 0, 0) },
                new TextBlock { Text = AppStrings.TagSuggestionsLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold },
                new TextBlock { Text = AppStrings.TagSuggestionsDescription, TextWrapping = TextWrapping.WrapWholeWords, Opacity = 0.85 },
                tagSuggestionsBox,
                new TextBlock { Text = AppStrings.GoalSuggestionsLabel, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold },
                new TextBlock { Text = AppStrings.GoalSuggestionsDescription, TextWrapping = TextWrapping.WrapWholeWords, Opacity = 0.85 },
                goalSuggestionsBox,
            }
        };

        var scrollViewer = new ScrollViewer
        {
            Content = stack,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            MaxHeight = 560,
        };

        var dialog = new ContentDialog
        {
            Title = AppStrings.DatabaseSettingsTitle,
            Content = scrollViewer,
            PrimaryButtonText = AppStrings.DatabaseSettingsPrimary,
            CloseButtonText = AppStrings.Cancel,
        };

        var result = await DialogHost.ShowAsync(dialog);
        if (result != ContentDialogResult.Primary)
        {
            return new DatabaseSettingsDialogResult(
                false,
                currentMode,
                AppConfigManager.Config.TaskMetadata.TagSuggestions,
                AppConfigManager.Config.TaskMetadata.GoalSuggestions);
        }

        var selected = radioButtons.SelectedItem as DatabaseModeOption;
        return new DatabaseSettingsDialogResult(
            true,
            selected?.Mode ?? currentMode,
            ParseSuggestionLines(tagSuggestionsBox.Text),
            ParseSuggestionLines(goalSuggestionsBox.Text));
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

    private static TextBox BuildMultilineTextBox(IEnumerable<string> values)
    {
        return new TextBox
        {
            AcceptsReturn = true,
            TextWrapping = TextWrapping.Wrap,
            Height = 120,
            Text = string.Join(Environment.NewLine, values),
        };
    }

    private static List<string> ParseSuggestionLines(string? text)
    {
        return (text ?? string.Empty)
            .Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.None)
            .Select(static line => line.Trim())
            .Where(static line => !string.IsNullOrWhiteSpace(line))
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }
}

public sealed record DatabaseSettingsDialogResult(
    bool Saved,
    DbLocationMode SelectedMode,
    IReadOnlyList<string> TagSuggestions,
    IReadOnlyList<string> GoalSuggestions);

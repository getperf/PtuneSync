using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.WinUI.UI.Controls;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using PtuneSync.Infrastructure;
using PtuneSync.Protocol;
using Windows.ApplicationModel.DataTransfer;

namespace PtuneSync.Services;

public sealed class ReviewReportDialogService
{
    private readonly ReviewQueryService _reviewQueryService;
    private readonly ReviewTimetableBuilder _reviewTimetableBuilder;
    private readonly PullCommandService _pullCommandService;

    public ReviewReportDialogService()
        : this(new ReviewQueryService(), new ReviewTimetableBuilder(), new PullCommandService())
    {
    }

    public ReviewReportDialogService(
        ReviewQueryService reviewQueryService,
        ReviewTimetableBuilder reviewTimetableBuilder,
        PullCommandService pullCommandService)
    {
        _reviewQueryService = reviewQueryService;
        _reviewTimetableBuilder = reviewTimetableBuilder;
        _pullCommandService = pullCommandService;
    }

    public async Task ShowAsync(string listName)
    {
        const double dialogWidth = 1320;
        const double tableWidth = 1220;
        const double tableHeight = 520;

        var availableDates = Enumerable.Range(0, 7)
            .Select(offset => DateTime.Today.AddDays(-offset).ToString("yyyy-MM-dd"))
            .ToList();

        var dateComboBox = new ComboBox
        {
            Width = 140,
            ItemsSource = availableDates,
            SelectedIndex = 0,
        };

        var runButton = new Button
        {
            Content = AppStrings.ReviewReportRunButton,
        };

        var copyButton = new Button
        {
            Content = AppStrings.ReviewReportCopyButton,
            IsEnabled = false,
        };

        var summaryText = new TextBlock
        {
            TextWrapping = TextWrapping.Wrap,
        };

        var statusText = new TextBlock
        {
            Text = AppStrings.Ready,
            TextWrapping = TextWrapping.Wrap,
        };

        var dataGrid = new DataGrid
        {
            AutoGenerateColumns = false,
            IsReadOnly = true,
            HeadersVisibility = DataGridHeadersVisibility.Column,
            GridLinesVisibility = DataGridGridLinesVisibility.Horizontal,
            CanUserResizeColumns = true,
            CanUserSortColumns = false,
            SelectionMode = DataGridSelectionMode.Single,
            RowHeaderWidth = 4,
            MinColumnWidth = 48,
            HorizontalAlignment = HorizontalAlignment.Left,
            Width = tableWidth,
            MinWidth = tableWidth,
            Height = tableHeight,
            Columns =
            {
                new DataGridTextColumn { Header = "状態", Binding = new Microsoft.UI.Xaml.Data.Binding { Path = new PropertyPath(nameof(ReviewTimetableRow.Status)) }, Width = new DataGridLength(72) },
                new DataGridTextColumn { Header = "タイトル", Binding = new Microsoft.UI.Xaml.Data.Binding { Path = new PropertyPath(nameof(ReviewTimetableRow.DisplayTitle)) }, Width = new DataGridLength(420) },
                new DataGridTextColumn { Header = "計画", Binding = new Microsoft.UI.Xaml.Data.Binding { Path = new PropertyPath(nameof(ReviewTimetableRow.PlannedPomodoro)) }, Width = new DataGridLength(72) },
                new DataGridTextColumn { Header = "実績", Binding = new Microsoft.UI.Xaml.Data.Binding { Path = new PropertyPath(nameof(ReviewTimetableRow.ActualPomodoro)) }, Width = new DataGridLength(72) },
                new DataGridTextColumn { Header = "開始", Binding = new Microsoft.UI.Xaml.Data.Binding { Path = new PropertyPath(nameof(ReviewTimetableRow.Started)) }, Width = new DataGridLength(80) },
                new DataGridTextColumn { Header = "完了", Binding = new Microsoft.UI.Xaml.Data.Binding { Path = new PropertyPath(nameof(ReviewTimetableRow.Completed)) }, Width = new DataGridLength(80) },
                new DataGridTextColumn { Header = "備考", Binding = new Microsoft.UI.Xaml.Data.Binding { Path = new PropertyPath(nameof(ReviewTimetableRow.Remark)) }, Width = new DataGridLength(360) },
            }
        };

        dataGrid.LoadingRow += (_, e) =>
        {
            if (e.Row.DataContext is ReviewTimetableRow row && row.IsCompleted)
            {
                e.Row.Foreground = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 0x8A, 0x8F, 0x98));
            }
            else
            {
                e.Row.ClearValue(Control.ForegroundProperty);
            }
        };

        var content = new Grid
        {
            Width = dialogWidth,
            MinWidth = dialogWidth,
            RowDefinitions =
            {
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
            },
        };

        var toolbar = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            Children =
            {
                new TextBlock
                {
                    Text = AppStrings.ReviewReportDateLabel,
                    VerticalAlignment = VerticalAlignment.Center,
                },
                dateComboBox,
                runButton,
                copyButton,
            }
        };
        Grid.SetRow(toolbar, 0);
        Grid.SetRow(summaryText, 1);
        Grid.SetRow(dataGrid, 2);
        Grid.SetRow(statusText, 3);
        content.Children.Add(toolbar);
        content.Children.Add(summaryText);
        content.Children.Add(dataGrid);
        content.Children.Add(statusText);

        var dialog = new ContentDialog
        {
            Title = AppStrings.ReviewReportTitle,
            Content = content,
            CloseButtonText = AppStrings.ReviewReportCloseButton,
            DefaultButton = ContentDialogButton.Close,
            FullSizeDesired = true,
            XamlRoot = MainWindow.Current.Content.XamlRoot,
        };
        dialog.Resources["ContentDialogMaxWidth"] = dialogWidth + 80;
        dialog.Resources["ContentDialogMinWidth"] = dialogWidth + 80;

        string markdown = string.Empty;

        async Task LoadReportAsync()
        {
            try
            {
                runButton.IsEnabled = false;
                copyButton.IsEnabled = false;
                var selectedDate = dateComboBox.SelectedItem?.ToString() ?? availableDates[0];
                if (selectedDate == DateTime.Today.ToString("yyyy-MM-dd"))
                {
                    statusText.Text = "最新状態を取得しています…";
                    await _pullCommandService.ExecuteAsync(new RunRequestFile
                    {
                        Home = AppPaths.VaultHome,
                        Args = new RunRequestArgs
                        {
                            List = listName,
                            IncludeCompleted = true,
                        },
                    });
                }

                statusText.Text = AppStrings.ReviewReportLoading;
                summaryText.Text = string.Empty;
                dataGrid.ItemsSource = null;

                var request = new RunRequestFile
                {
                    Home = AppPaths.VaultHome,
                    Args = new RunRequestArgs
                    {
                        List = listName,
                        Date = selectedDate,
                    },
                };

                var result = await _reviewQueryService.ExecuteAsync(request);
                var document = _reviewTimetableBuilder.Build(result);
                summaryText.Text = document.Summary;
                statusText.Text = document.StatusText;
                markdown = document.Markdown;
                dataGrid.ItemsSource = document.Rows;
                copyButton.IsEnabled = !string.IsNullOrWhiteSpace(markdown);
            }
            catch (Exception ex)
            {
                summaryText.Text = string.Empty;
                statusText.Text = $"レポート生成に失敗しました: {ex.Message}";
                markdown = string.Empty;
                dataGrid.ItemsSource = null;
            }
            finally
            {
                runButton.IsEnabled = true;
            }
        }

        runButton.Click += async (_, _) => await LoadReportAsync();
        copyButton.Click += (_, _) =>
        {
            if (string.IsNullOrWhiteSpace(markdown))
            {
                return;
            }

            var package = new DataPackage();
            package.SetText(markdown);
            Clipboard.SetContent(package);
            statusText.Text = AppStrings.ReviewReportCopied;
        };

        await LoadReportAsync();
        await dialog.ShowAsync();
    }
}

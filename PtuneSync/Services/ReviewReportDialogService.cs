using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
        const double defaultDialogWidth = 980;
        const double defaultDialogHeight = 700;
        const double minDialogWidth = 780;
        const double maxDialogWidth = 1120;
        const double minBodyHeight = 420;
        const double maxBodyHeight = 760;

        var hostRoot = MainWindow.Current.Content as FrameworkElement;
        var hostWidth = hostRoot?.ActualWidth > 0 ? hostRoot.ActualWidth : defaultDialogWidth;
        var hostHeight = hostRoot?.ActualHeight > 0 ? hostRoot.ActualHeight : defaultDialogHeight;
        var dialogWidth = Math.Clamp(hostWidth - 64, minDialogWidth, maxDialogWidth);
        var bodyHeight = Math.Clamp(hostHeight - 180, minBodyHeight, maxBodyHeight);

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
            MinWidth = 96,
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

        var headerGrid = CreateHeaderGrid();
        var rowsPanel = new StackPanel
        {
            Orientation = Orientation.Vertical,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
        var rowsHost = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            VerticalAlignment = VerticalAlignment.Stretch,
            Height = bodyHeight,
            Content = rowsPanel,
        };

        var content = new Grid
        {
            RowDefinitions =
            {
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
            },
        };

        var closeButton = new Button
        {
            Content = AppStrings.ReviewReportCloseButton,
            MinWidth = 84,
        };

        var toolbar = new Grid
        {
            HorizontalAlignment = HorizontalAlignment.Stretch,
            ColumnSpacing = 8,
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = GridLength.Auto },
                new ColumnDefinition { Width = GridLength.Auto },
                new ColumnDefinition { Width = GridLength.Auto },
                new ColumnDefinition { Width = GridLength.Auto },
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                new ColumnDefinition { Width = GridLength.Auto },
                new ColumnDefinition { Width = GridLength.Auto },
            }
        };
        var dateLabel = new TextBlock
        {
            Text = AppStrings.ReviewReportDateLabel,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(dateLabel, 0);
        Grid.SetColumn(dateComboBox, 1);
        Grid.SetColumn(runButton, 2);
        Grid.SetColumn(copyButton, 5);
        Grid.SetColumn(closeButton, 6);
        toolbar.Children.Add(dateLabel);
        toolbar.Children.Add(dateComboBox);
        toolbar.Children.Add(runButton);
        toolbar.Children.Add(copyButton);
        toolbar.Children.Add(closeButton);
        Grid.SetRow(toolbar, 0);
        Grid.SetRow(summaryText, 1);
        Grid.SetRow(headerGrid, 2);
        Grid.SetRow(rowsHost, 3);
        content.Children.Add(toolbar);
        content.Children.Add(summaryText);
        content.Children.Add(headerGrid);
        content.Children.Add(rowsHost);
        Grid.SetRow(statusText, 4);
        content.Children.Add(statusText);

        var dialog = new ContentDialog
        {
            Title = AppStrings.ReviewReportTitle,
            Content = content,
            CloseButtonText = string.Empty,
            DefaultButton = ContentDialogButton.None,
            FullSizeDesired = true,
            XamlRoot = MainWindow.Current.Content.XamlRoot,
        };
        dialog.Resources["ContentDialogMaxWidth"] = dialogWidth;
        dialog.Resources["ContentDialogMinWidth"] = dialogWidth;
        closeButton.Click += (_, _) => dialog.Hide();

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
                rowsPanel.Children.Clear();

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
                foreach (var row in document.Rows)
                {
                    rowsPanel.Children.Add(CreateRowElement(row));
                }
                copyButton.IsEnabled = !string.IsNullOrWhiteSpace(markdown);
            }
            catch (Exception ex)
            {
                summaryText.Text = string.Empty;
                statusText.Text = $"レポート生成に失敗しました: {ex.Message}";
                markdown = string.Empty;
                rowsPanel.Children.Clear();
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

    private static Grid CreateHeaderGrid()
    {
        var grid = CreateTableGrid();
        grid.Padding = new Thickness(12, 10, 12, 10);
        grid.Background = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 0xF6, 0xF7, 0xF9));

        AddHeaderText(grid, "状態", 0);
        AddHeaderText(grid, "タイトル", 1);
        AddHeaderText(grid, "計画🍅", 2);
        AddHeaderText(grid, "実績✅", 3);
        AddHeaderText(grid, "開始", 4);
        AddHeaderText(grid, "完了", 5);
        AddHeaderText(grid, "備考", 6);

        return grid;
    }

    private static void AddHeaderText(Grid grid, string text, int column)
    {
        var textBlock = new TextBlock
        {
            Text = text,
            FontWeight = Microsoft.UI.Text.FontWeights.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(textBlock, column);
        grid.Children.Add(textBlock);
    }

    private static Grid CreateTableGrid()
    {
        var grid = new Grid
        {
            HorizontalAlignment = HorizontalAlignment.Stretch,
            ColumnSpacing = 12,
        };
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(44) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(64) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(64) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(64) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(64) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(120) });
        return grid;
    }

    private static UIElement CreateRowElement(ReviewTimetableRow row)
    {
        var grid = CreateTableGrid();
        grid.Children.Add(CreateCell(row.Status, 0, HorizontalAlignment.Center, secondary: true));
        grid.Children.Add(CreateCell(row.DisplayTitle, 1, HorizontalAlignment.Left));
        grid.Children.Add(CreateCell(row.PlannedPomodoro, 2, HorizontalAlignment.Center));
        grid.Children.Add(CreateCell(row.ActualPomodoro, 3, HorizontalAlignment.Center));
        grid.Children.Add(CreateCell(row.Started, 4, HorizontalAlignment.Center));
        grid.Children.Add(CreateCell(row.Completed, 5, HorizontalAlignment.Center));
        grid.Children.Add(CreateCell(row.Remark, 6, HorizontalAlignment.Left, secondary: true));

        return new Border
        {
            BorderBrush = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(17, 0, 0, 0)),
            BorderThickness = new Thickness(0, 0, 0, 1),
            Padding = new Thickness(12, 8, 12, 8),
            Child = grid,
        };
    }

    private static TextBlock CreateCell(
        string text,
        int column,
        HorizontalAlignment alignment,
        bool secondary = false)
    {
        var textBlock = new TextBlock
        {
            Text = text,
            TextWrapping = TextWrapping.WrapWholeWords,
            HorizontalAlignment = alignment,
            VerticalAlignment = VerticalAlignment.Center,
        };

        if (secondary)
        {
            textBlock.Foreground = (Brush)Application.Current.Resources["TextFillColorSecondaryBrush"];
        }

        Grid.SetColumn(textBlock, column);
        return textBlock;
    }
}

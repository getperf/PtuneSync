using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using PtuneSync.Services;

namespace PtuneSync.Infrastructure;

public class UserDialogService
{
    private XamlRoot GetRoot()
    {
        return MainWindow.Current.Content.XamlRoot;
    }

    public async Task<bool> ConfirmAsync(string message, string title = "確認")
    {
        var dialog = new ContentDialog
        {
            Title = title,
            Content = message,
            PrimaryButtonText = "OK",
            CloseButtonText = "キャンセル",
            XamlRoot = GetRoot()
        };

        var result = await dialog.ShowAsync();
        return result == ContentDialogResult.Primary;
    }

    public async Task ShowMessageAsync(string message, string title = "情報")
    {
        var dialog = new ContentDialog
        {
            Title = title,
            Content = message,
            CloseButtonText = "OK",
            XamlRoot = GetRoot()
        };

        await dialog.ShowAsync();
    }

    public async Task<bool> ConfirmDiffAsync(DiffCommandResult diff, bool allowDelete)
    {
        var summaryLines = new[]
        {
            $"新規作成: {diff.Summary.Create}",
            $"更新: {diff.Summary.Update}",
            $"削除: {diff.Summary.Delete}",
            $"エラー: {diff.Summary.Errors}",
            $"警告: {diff.Summary.Warnings}",
            $"既存タスク削除: {(allowDelete ? "あり" : "なし")}",
        };

        var details = string.Join(Environment.NewLine, summaryLines);

        if (diff.Errors.Count > 0)
        {
            details += $"{Environment.NewLine}{Environment.NewLine}=== エラー詳細 ==={Environment.NewLine}{string.Join(Environment.NewLine, diff.Errors)}";
        }

        if (diff.Warnings.Count > 0)
        {
            details += $"{Environment.NewLine}{Environment.NewLine}=== 警告詳細 ==={Environment.NewLine}{string.Join(Environment.NewLine, diff.Warnings.Select(FormatWarningMessage))}";
        }

        var content = new StackPanel
        {
            Spacing = 12,
            Children =
            {
                new TextBlock
                {
                    Text = "Push 前に差分を確認してください。",
                    TextWrapping = TextWrapping.Wrap,
                },
                new ScrollViewer
                {
                    VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                    MinWidth = 480,
                    MinHeight = 260,
                    Content = new TextBlock
                    {
                        Text = details,
                        TextWrapping = TextWrapping.Wrap,
                        IsTextSelectionEnabled = true,
                    }
                }
            }
        };

        var dialog = new ContentDialog
        {
            Title = diff.Summary.Errors > 0 ? "Diff エラー" : "Diff 確認",
            Content = content,
            PrimaryButtonText = "Push 実行",
            IsPrimaryButtonEnabled = diff.Summary.Errors == 0,
            CloseButtonText = diff.Summary.Errors > 0 ? "閉じる" : "キャンセル",
            DefaultButton = diff.Summary.Errors > 0 ? ContentDialogButton.Close : ContentDialogButton.Primary,
            XamlRoot = GetRoot()
        };

        var result = await dialog.ShowAsync();
        return diff.Summary.Errors == 0 && result == ContentDialogResult.Primary;
    }

    private static string FormatWarningMessage(string warning)
    {
        const string completedTaskPrefix = "Skip reopen completed task: ";
        if (warning.StartsWith(completedTaskPrefix, StringComparison.Ordinal))
        {
            var payload = warning[completedTaskPrefix.Length..];
            var title = ExtractTaskTitle(payload);
            return $"完了済みタスクは未完了に戻さず、そのまま維持します: {title}";
        }

        return warning;
    }

    private static string ExtractTaskTitle(string payload)
    {
        var index = payload.LastIndexOf(" (", StringComparison.Ordinal);
        if (index <= 0)
        {
            return payload.Trim();
        }

        return payload[..index].Trim();
    }
}

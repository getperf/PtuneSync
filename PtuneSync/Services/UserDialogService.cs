using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml;
using System.Threading.Tasks;
using System;

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
}

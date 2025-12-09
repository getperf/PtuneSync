using System;
using System.Threading.Tasks;
using Microsoft.UI.Xaml.Controls;

namespace PtuneSync.Infrastructure
{
    public static class DialogHost
    {
        public static async Task<ContentDialogResult> ShowAsync(ContentDialog dialog)
        {
            dialog.XamlRoot = MainWindow.Current.Content.XamlRoot;
            return await dialog.ShowAsync();
        }
    }
}

using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace PtuneSync;

public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        this.AppWindow.Resize(new Windows.Graphics.SizeInt32(640, 480)); 
    }

    private void OnCloseClicked(object sender, RoutedEventArgs e)
    {
        Close();
    }
}

// File: MainWindow.xaml.cs
using Microsoft.UI.Xaml;

namespace PtuneSync;

public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        ActivationSessionManager.IsGuiMode = true;
        this.InitializeComponent();
        this.AppWindow.Resize(new Windows.Graphics.SizeInt32(900, 600));
    }
}

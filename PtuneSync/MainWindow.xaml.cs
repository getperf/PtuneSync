using Microsoft.UI.Xaml;

namespace PtuneSync
{
    public sealed partial class MainWindow : Window
    {
        public static new MainWindow Current { get; private set; } = null!;

        public MainWindow()
        {
            ActivationSessionManager.IsGuiMode = true;

            this.InitializeComponent();
            this.AppWindow.Resize(new Windows.Graphics.SizeInt32(900, 600));

            Current = this;
        }
    }
}

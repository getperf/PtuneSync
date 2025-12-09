using Microsoft.UI.Xaml;
using Microsoft.UI.Windowing;
using Windows.Graphics;
using System.IO;
using System.Reflection;

namespace PtuneSync
{
    public sealed partial class MainWindow : Window
    {
        public static new MainWindow Current { get; private set; } = null!;

        public MainWindow()
        {
            ActivationSessionManager.IsGuiMode = true;

            InitializeComponent();

            this.Title = "PtuneSync";

            var appWindow = this.AppWindow;
            if (appWindow != null)
            {
                appWindow.Resize(new SizeInt32(900, 600));

                // ★ アイコン設定
                var exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
                var iconPath = Path.Combine(exeDir, "Assets", "Icon.ico");
                appWindow.SetIcon(iconPath);
            }

            Current = this;
        }
    }
}

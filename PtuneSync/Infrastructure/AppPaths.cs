using System;
using System.IO;
using Windows.Storage;

namespace PtuneSync.Infrastructure
{
    public static class AppPaths
    {
        /// <summary>
        /// WinUI アプリが書き込み可能な LocalState ディレクトリ
        /// 例: C:\Users\<User>\AppData\Local\Packages\<PFN>\LocalState
        /// </summary>
        public static string LocalStateRoot =>
            ApplicationData.Current.LocalFolder.Path;

        public static string Logs =>
            Path.Combine(LocalStateRoot, "logs");

        /// <summary>
        /// Obsidian 互換の vault_home に相当する場所を LocalState 下に定義する
        /// （GUI 版では LocalState を vault_home と扱う）
        /// </summary>
        public static string VaultHome =>
            Path.Combine(LocalStateRoot, "vault_home");

        /// <summary>
        /// .obsidian/plugins/ptune-log/work の作成
        /// </summary>
        public static string WorkDir(string vaultHome) =>
            Path.Combine(vaultHome, ".obsidian", "plugins", "ptune-log", "work");

        public static string EnsureDirectory(string path)
        {
            Directory.CreateDirectory(path);
            return path;
        }
    }
}

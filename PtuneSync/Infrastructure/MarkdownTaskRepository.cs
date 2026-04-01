using System;
using System.IO;

namespace PtuneSync.Infrastructure;

/// <summary>
/// アプリの LocalState に保存された tasks.md を読み書きする
/// </summary>
public sealed class MarkdownTaskRepository
{
    private const string FileName = "tasks.md";

    public string Read()
    {
        var path = GetPath();

        if (!File.Exists(path))
            throw new FileNotFoundException("tasks.md not found", path);

        return File.ReadAllText(path);
    }

    public void Write(string markdown)
    {
        var path = GetPath();
        File.WriteAllText(path, markdown);

        AppLog.Info("[MarkdownTaskRepository] Markdown written: {0}", path);
    }

    public static string GetPath()
    {
        return Path.Combine(AppPaths.LocalStateRoot, FileName);
    }
}

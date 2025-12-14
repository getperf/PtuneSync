using System;
using System.Collections.Generic;
using PtuneSync.Infrastructure;

public static class SessionNames
{
    public const string Auth = "auth";
    public const string Import = "import";
    public const string Export = "export";

    public const string GetTasksMarkdown = "get-tasks-md";
}

public static class ActivationSessionManager
{
    private static readonly HashSet<string> _pendingOps = new();

    /// <summary>
    /// GUIモードでは Session End しても Exit しない
    /// 初期値: false → プロトコル起動の場合のみ Exit
    /// </summary>
    public static bool IsGuiMode { get; set; } = false;

    public static void Begin(string op)
    {
        _pendingOps.Add(op);
        AppLog.Debug("[Session] Begin {0}", op);
    }

    public static void End(string op)
    {
        _pendingOps.Remove(op);
        AppLog.Debug("[Session] End {0}", op);

        if (_pendingOps.Count == 0)
        {
            if (IsGuiMode)
            {
                AppLog.Info("[Session] Completed (GUI mode) → stay alive");
                return;
            }

            AppLog.Info("[Session] All operations complete → Exit");
            Environment.Exit(0);
        }
    }
}

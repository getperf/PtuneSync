using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.Protocol;

public static class ProtocolDispatcher
{
    private static readonly Dictionary<string, IProtocolHandler> _handlers = new()
    {
        { "launch", new Handlers.LaunchHandler() },
        { "export", new Handlers.ExportHandler() },
        { "import", new Handlers.ImportHandler() },
        { "auth",   new Handlers.AuthHandler() }
    };

    public static async Task Dispatch(Uri uri)
    {
        var request = new ProtocolRequest(uri);
        AppLog.Info("[ProtocolDispatcher] Protocol Activated: {Uri}", uri);

        if (_handlers.TryGetValue(request.Command, out var handler))
        {
            try
            {
                await handler.ExecuteAsync(request);
            }
            catch (Exception ex)
            {
                AppLog.Error(ex, "[ProtocolDispatcher] Handler execution failed for {Command}", request.Command);
            }
        }
        else
        {
            AppLog.Warn("[ProtocolDispatcher] Unknown command: {Command}, Uri={Uri}", request.Command, uri);
        }
    }
}

using System;
using System.Collections.Specialized;
using System.Web;

namespace PtuneSync.Protocol;

public class ProtocolRequest
{
    public string Command { get; }
    public NameValueCollection Query { get; }

    public ProtocolRequest(Uri uri)
    {
        // 例: /launch -> launch
        Command = uri.AbsolutePath.Trim('/').ToLowerInvariant();

        Query = HttpUtility.ParseQueryString(uri.Query);
    }

    public string? Get(string key) => Query.Get(key);
}

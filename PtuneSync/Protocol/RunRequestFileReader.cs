using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace PtuneSync.Protocol;

public static class RunRequestFileReader
{
    public static async Task<RunRequestFile?> ReadAsync(string requestFile)
    {
        if (string.IsNullOrWhiteSpace(requestFile) || !File.Exists(requestFile))
        {
            return null;
        }

        var raw = await File.ReadAllTextAsync(requestFile);
        return JsonSerializer.Deserialize<RunRequestFile>(raw);
    }

    public static bool IsValid(RunRequestFile? runRequest)
    {
        return runRequest != null
            && !string.IsNullOrWhiteSpace(runRequest.ResolvePublicRequestIdentity())
            && !string.IsNullOrWhiteSpace(runRequest.ResolveStatusFile());
    }
}

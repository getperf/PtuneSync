using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace PtuneSync.Protocol;

public static class RunStatusSnapshotReader
{
    public static async Task<RunStatusSnapshot?> ReadAsync(string statusFile)
    {
        if (string.IsNullOrWhiteSpace(statusFile) || !File.Exists(statusFile))
        {
            return null;
        }

        var raw = await File.ReadAllTextAsync(statusFile);
        return JsonSerializer.Deserialize<RunStatusSnapshot>(raw);
    }
}

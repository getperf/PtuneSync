using System.Threading.Tasks;

namespace PtuneSync.Protocol;

public interface IProtocolHandler
{
    Task ExecuteAsync(ProtocolRequest request);
}

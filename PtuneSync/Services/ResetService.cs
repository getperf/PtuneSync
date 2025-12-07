using System.Threading.Tasks;
using CommunityToolkit.Mvvm.Messaging;
using PtuneSync.Infrastructure;
using PtuneSync.Messages;

namespace PtuneSync.Services
{
    public class ResetService
    {
        public Task ExecuteAsync()
        {
            AppLog.Debug("[ResetService] ExecuteAsync called: sending ResetTasksMessage");

            WeakReferenceMessenger.Default.Send(new ResetTasksMessage());

            AppLog.Debug("[ResetService] ResetTasksMessage sent");
            return Task.CompletedTask;
        }
    }
}

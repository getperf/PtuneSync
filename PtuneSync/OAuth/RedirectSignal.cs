using System;
using System.Threading;
using System.Threading.Tasks;

namespace PtuneSync
{
    public static class RedirectSignal
    {
        private static TaskCompletionSource<string>? _tcs;

        public static Task<string> WaitAsync(TimeSpan timeout)
        {
            _tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
            var cts = new CancellationTokenSource(timeout);
            cts.Token.Register(() => _tcs?.TrySetException(new TimeoutException("Redirect timeout")));
            return _tcs.Task;
        }

        public static void Set(string redirectUri) => _tcs?.TrySetResult(redirectUri);
    }
}

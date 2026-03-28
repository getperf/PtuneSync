using System;
using System.Threading.Tasks;
using System.Threading;

namespace PtuneSync
{
    public static class RedirectSignal
    {
        private static TaskCompletionSource<string>? _tcs;
        private static readonly object _lock = new();

        public static Task<string> WaitAsync(TimeSpan timeout)
        {
            TaskCompletionSource<string> tcs;
            lock (_lock)
            {
                _tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
                tcs = _tcs;
            }

            return WaitWithTimeoutAsync(tcs, timeout);
        }

        public static void Set(string redirectUri)
        {
            lock (_lock)
            {
                _tcs?.TrySetResult(redirectUri);
            }
        }

        public static void Reset()
        {
            lock (_lock)
            {
                _tcs = null;
            }
        }

        private static async Task<string> WaitWithTimeoutAsync(TaskCompletionSource<string> tcs, TimeSpan timeout)
        {
            var completed = await Task.WhenAny(tcs.Task, Task.Delay(timeout));
            if (completed != tcs.Task)
            {
                throw new TimeoutException("Redirect timeout");
            }

            return await tcs.Task;
        }
    }
}

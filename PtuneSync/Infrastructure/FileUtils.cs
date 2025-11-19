using System;
using System.IO;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.Infrastructure
{
    public static class FileUtils
    {
        /// <summary>
        /// File.Move に短時間リトライを行う。
        /// UnauthorizedAccessException / IOException が発生した場合に一定間隔で再試行。
        /// </summary>
        public static async Task MoveWithRetryAsync(string sourceFile, string destFile, bool overwrite = true, int maxRetry = 3, int delayMs = 100)
        {
            for (int i = 0; i < maxRetry; i++)
            {
                try
                {
                    File.Move(sourceFile, destFile, overwrite);
                    return;
                }
                catch (IOException ex)
                {
                    AppLog.Debug("[FileUtils] Move retry {0}/{1}: {2}", i + 1, maxRetry, ex.Message);
                    await Task.Delay(delayMs);
                }
                catch (UnauthorizedAccessException ex)
                {
                    AppLog.Debug("[FileUtils] Unauthorized retry {0}/{1}: {2}", i + 1, maxRetry, ex.Message);
                    await Task.Delay(delayMs);
                }
            }

            // すべて失敗した場合は例外を再送出
            throw new IOException($"MoveWithRetryAsync failed after {maxRetry} retries: {sourceFile} -> {destFile}");
        }
    }
}

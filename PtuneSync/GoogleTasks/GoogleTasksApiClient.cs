using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.GoogleTasks;

public class GoogleTasksApiClient
{
    private readonly HttpClient _client;
    private readonly string _accessToken;

    public GoogleTasksApiClient(string accessToken)
    {
        _accessToken = accessToken;
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
    }

    public async Task<T?> RequestAsync<T>(string url, HttpMethod method, object? body = null)
    {
        try
        {
            AppLog.Debug("[GoogleTasksApiClient] Start request: {0} ({1})", method, url);

            using var request = new HttpRequestMessage(method, url);
            if (body != null)
            {
                string json = JsonSerializer.Serialize(body);
                request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                AppLog.Debug("[GoogleTasksApiClient] Request Body: {0}", json);
            }

            var res = await _client.SendAsync(request);
            string text = await res.Content.ReadAsStringAsync();

            AppLog.Debug("[GoogleTasksApiClient] HTTP {0}, Length={1}", res.StatusCode, text.Length);

            if (!res.IsSuccessStatusCode)
            {
                AppLog.Warn("[GoogleTasksApiClient] HTTP {0}: {1}", res.StatusCode, text);
                throw new Exception($"Google Tasks API error ({res.StatusCode}): {text}");
            }

            if (res.StatusCode == System.Net.HttpStatusCode.NoContent)
            {
                AppLog.Debug("[GoogleTasksApiClient] No content response (204)");
                return default;
            }

            var result = JsonSerializer.Deserialize<T>(
                text,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            AppLog.Debug("[GoogleTasksApiClient] Deserialization success: {0}", typeof(T).Name);
            return result;
        }
        catch (Exception ex)
        {
            AppLog.Error(ex, "[GoogleTasksApiClient] Request failed: {0}", url);
            throw;
        }
    }
}

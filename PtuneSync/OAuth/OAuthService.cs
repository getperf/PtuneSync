using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Windows.System;
using PtuneSync.Infrastructure;

namespace PtuneSync.OAuth;

public class OAuthService
{
    private readonly GoogleOAuthConfig _config;
    private string? _codeVerifier;

    public OAuthService(GoogleOAuthConfig config) => _config = config;

    public async Task<OAuthToken> AuthorizeAndGetTokenAsync()
    {
        AppLog.Info("[OAuthService] AuthorizeAndGetTokenAsync start");

        _codeVerifier = GenerateRandomString(64);
        var codeChallenge = Base64UrlEncode(ComputeSha256(_codeVerifier));

        string authUrl =
            "https://accounts.google.com/o/oauth2/v2/auth" +
            $"?response_type=code&client_id={Uri.EscapeDataString(_config.ClientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(_config.RedirectUri)}" +
            $"&scope={Uri.EscapeDataString(_config.Scope)}" +
            $"&access_type=offline&code_challenge={codeChallenge}&code_challenge_method=S256";

        AppLog.Debug("[OAuthService] Launching browser: {0}", authUrl);
        bool ok = await Launcher.LaunchUriAsync(new Uri(authUrl));
        if (!ok) throw new Exception("Browser launch failed");

        AppLog.Debug("[OAuthService] Waiting for redirect...");
        var redirectUri = await RedirectSignal.WaitAsync(TimeSpan.FromMinutes(5));
        AppLog.Debug("[OAuthService] Redirect received: {0}", redirectUri);

        var token = await ExchangeCodeForTokenAsync(redirectUri);

        // 安全なログ出力（長さを確認）
        var safeAccess = string.IsNullOrEmpty(token.AccessToken)
            ? "<empty>"
            : token.AccessToken[..Math.Min(20, token.AccessToken.Length)];
        AppLog.Info("[OAuthService] Access token acquired: {0}", safeAccess);

        WindowsNotifier.Show(
            "Google 認証が完了しました",
            "ブラウザを閉じて、PtuneSync に戻ってください。"
        );
        return token;
    }

    private async Task<OAuthToken> ExchangeCodeForTokenAsync(string redirectUri)
    {
        AppLog.Debug("[OAuthService] ExchangeCodeForTokenAsync start, redirectUri={0}", redirectUri);

        var query = System.Web.HttpUtility.ParseQueryString(new Uri(redirectUri).Query);
        string? code = query["code"];
        if (string.IsNullOrEmpty(code))
            throw new Exception("No code in redirect URI.");

        using var client = new HttpClient();
        var post = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string,string>("code", code),
            new KeyValuePair<string,string>("client_id", _config.ClientId),
            new KeyValuePair<string,string>("redirect_uri", _config.RedirectUri),
            new KeyValuePair<string,string>("grant_type", "authorization_code"),
            new KeyValuePair<string,string>("code_verifier", _codeVerifier ?? "")
        });

        var res = await client.PostAsync("https://oauth2.googleapis.com/token", post);
        string json = await res.Content.ReadAsStringAsync();
        AppLog.Debug("[OAuthService] Token raw response: {0}", json);

        if (!res.IsSuccessStatusCode)
        {
            AppLog.Warn("[OAuthService] HTTP {0}: {1}", res.StatusCode, json);
            throw new Exception("Token endpoint error");
        }

        // ✅ CaseInsensitive オプションを適用
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var token = JsonSerializer.Deserialize<OAuthToken>(json, options);
        if (token == null)
            throw new Exception("Failed to deserialize OAuthToken: " + json);

        AppLog.Debug("[OAuthService] [DEBUG] Deserialized token: expires_in={0}, refresh_token={1}",
            token.ExpiresIn, string.IsNullOrEmpty(token.RefreshToken) ? "none" : "exists");

        return token;
    }

    public async Task<OAuthToken> RefreshTokenAsync(string refreshToken)
    {
        AppLog.Info("[OAuthService] RefreshTokenAsync start");

        using var client = new HttpClient();
        var post = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string,string>("client_id", _config.ClientId),
            new KeyValuePair<string,string>("grant_type", "refresh_token"),
            new KeyValuePair<string,string>("refresh_token", refreshToken)
        });

        var res = await client.PostAsync("https://oauth2.googleapis.com/token", post);
        string json = await res.Content.ReadAsStringAsync();
        AppLog.Debug("[OAuthService] Refresh response: {0}", json);

        if (!res.IsSuccessStatusCode)
        {
            AppLog.Warn("[OAuthService] HTTP {0}: {1}", res.StatusCode, json);
            throw new Exception("Refresh token endpoint error");
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var token = JsonSerializer.Deserialize<OAuthToken>(json, options);
        if (token == null)
            throw new Exception("Failed to deserialize refresh token response: " + json);

        token.RefreshToken ??= refreshToken;

        var safeAccess = string.IsNullOrEmpty(token.AccessToken)
            ? "<empty>"
            : token.AccessToken[..Math.Min(20, token.AccessToken.Length)];
        AppLog.Debug("[OAuthService] Refreshed access_token: {0}", safeAccess);
        return token;
    }

    // Helpers
    private static string GenerateRandomString(int length)
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[length];
        rng.GetBytes(bytes);
        return Base64UrlEncode(bytes);
    }

    private static byte[] ComputeSha256(string input)
    {
        using var sha = SHA256.Create();
        return sha.ComputeHash(Encoding.ASCII.GetBytes(input));
    }

    private static string Base64UrlEncode(byte[] input) =>
        Convert.ToBase64String(input).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}

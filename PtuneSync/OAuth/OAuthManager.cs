using System;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;

namespace PtuneSync.OAuth;

public class OAuthManager
{
    private readonly OAuthService _service;
    private readonly TokenStorage _storage;
    private readonly string _profileKey;
    private readonly string? _requestNonce;

    public OAuthManager(GoogleOAuthConfig config, string workDir, string? profileKey = null, string? requestNonce = null)
    {
        _service = new OAuthService(config);
        _storage = new TokenStorage(workDir);
        _profileKey = string.IsNullOrWhiteSpace(profileKey) ? "default" : profileKey;
        _requestNonce = requestNonce;
    }

    public async Task<OAuthToken> GetOrRefreshAsync()
    {
        var token = _storage.Load();

        if (token == null)
        {
            AppLog.Info("[OAuthManager] No token found -> start full auth flow");
            token = await _service.AuthorizeAndGetTokenAsync(_profileKey, _requestNonce);
            _storage.Save(token);
            return token;
        }

        if (token.ExpiresAt < DateTime.Now)
        {
            AppLog.Info("[OAuthManager] Token expired -> refresh flow");
            if (!string.IsNullOrEmpty(token.RefreshToken))
            {
                token = await _service.RefreshTokenAsync(token.RefreshToken);
                _storage.Save(token);
            }
            else
            {
                AppLog.Warn("[OAuthManager] No refresh_token -> start re-auth");
                token = await _service.AuthorizeAndGetTokenAsync(_profileKey, _requestNonce);
                _storage.Save(token);
            }
        }
        else
        {
            AppLog.Debug("[OAuthManager] Token valid until {0}", token.ExpiresAt);
        }

        return token;
    }
}

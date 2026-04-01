import { Notice, Plugin, requestUrl } from 'obsidian';
import { GoogleAuthSettings } from 'src/config/ConfigManager';
import { logger } from 'src/core/services/logger/loggerInstance';
import { ErrorUtils } from 'src/core/utils/common/ErrorUtils';
import { createAndLogError } from 'src/core/utils/errors/errorFactory';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface TokenStore {
  access_token: string | null;
  refresh_token: string | null;
  expires_in: number | null;
  obtained_at: number | null;
}

/** Google OAuthトークンの管理（保存・期限チェック・リフレッシュ） */
export class TokenManager {
  constructor(
    private plugin: Plugin,
    private authSettings: GoogleAuthSettings
  ) {
    const { clientId, clientSecret } = this.authSettings;
    if (!clientId?.trim() || !clientSecret?.trim()) {
      throw createAndLogError('Google 認証設定（Client ID / Secret）が未設定です');
    }
    logger.debug('[TokenManager.constructor] initialized', { clientId });
  }

  /** Plugin の保存データを安全に取得 */
  private async loadStore(): Promise<TokenStore | null> {
    const data = (await this.plugin.loadData()) as TokenStore | null;
    if (!data) return null;

    return {
      access_token: data.access_token ?? null,
      refresh_token: data.refresh_token ?? null,
      expires_in: data.expires_in ?? null,
      obtained_at: data.obtained_at ?? null,
    };
  }

  private async saveStore(store: TokenStore): Promise<void> {
    await this.plugin.saveData(store);
  }

  /** 有効なアクセストークンを取得する */
  async getValidAccessToken(): Promise<string | null> {
    const store = await this.loadStore();

    if (!store) {
      logger.warn('[TokenManager.getValidAccessToken] no token data');
      return null;
    }

    if (
      store.access_token &&
      store.expires_in &&
      store.obtained_at &&
      !this.isTokenExpired(store.obtained_at, store.expires_in)
    ) {
      logger.debug('[TokenManager.getValidAccessToken] using cached token');
      return store.access_token;
    }

    if (store.refresh_token) {
      logger.debug('[TokenManager.getValidAccessToken] refreshing token');
      return await this.refreshAccessToken(store.refresh_token);
    }

    logger.warn('[TokenManager.getValidAccessToken] no valid token');
    return null;
  }

  /** 有効期限チェック */
  private isTokenExpired(obtainedAt: number, expiresIn: number): boolean {
    const now = Date.now();
    const expired = now > obtainedAt + expiresIn * 1000 - 60000;
    logger.debug('[TokenManager.isTokenExpired]', { expired });
    return expired;
  }

  /** リフレッシュトークンでアクセストークン再取得 */
  private async refreshAccessToken(
    refreshToken: string
  ): Promise<string | null> {
    const { clientId, clientSecret } = this.authSettings;

    try {
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString();

      const res = await requestUrl({
        url: 'https://oauth2.googleapis.com/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (res.status < 200 || res.status >= 300) {
        logger.error('[TokenManager.refreshAccessToken] HTTP error', {
          status: res.status,
          text: res.text,
        });
        new Notice(`Google Auth error (${res.status})`, 8000);
        return null;
      }

      const tokens = res.json as TokenResponse;

      if (tokens.access_token) {
        const store: TokenStore = {
          access_token: tokens.access_token,
          refresh_token: refreshToken,
          expires_in: tokens.expires_in,
          obtained_at: Date.now(),
        };
        await this.saveStore(store);
        logger.info('[TokenManager.refreshAccessToken] refreshed');
        return tokens.access_token;
      }

      logger.error('[TokenManager.refreshAccessToken] token missing', tokens);
      new Notice('Google Auth: access_token missing', 8000);
      return null;

    } catch (e: unknown) {
      const msg = ErrorUtils.toMessage(e);
      logger.error('[TokenManager.refreshAccessToken] exception', msg);
      new Notice(`Google Auth exception: ${msg}`, 8000);
      return null;
    }
  }

  /** 初回トークン保存 */
  async saveInitialTokens(tokens: TokenResponse): Promise<void> {
    if (!tokens.access_token) {
      logger.warn('[TokenManager.saveInitialTokens] no access_token');
      return;
    }

    const store: TokenStore = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_in: tokens.expires_in,
      obtained_at: Date.now(),
    };

    await this.saveStore(store);
    logger.info('[TokenManager.saveInitialTokens] saved');
  }

  /** トークンリセット */
  async resetTokens(): Promise<void> {
    await this.saveStore({
      access_token: null,
      refresh_token: null,
      expires_in: null,
      obtained_at: null,
    });
    logger.info('[TokenManager.resetTokens] reset');
  }
}

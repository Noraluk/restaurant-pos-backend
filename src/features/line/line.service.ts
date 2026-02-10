import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

type LineTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type LineProfileResponse = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

@Injectable()
export class LineService {
  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(params: { state?: string } = {}) {
    const clientId = this.requireEnv('LINE_CHANNEL_ID');
    const redirectUri = this.requireEnv('LINE_REDIRECT_URI');
    const state = params.state ?? randomUUID();

    const url = new URL('https://access.line.me/oauth2/v2.1/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'profile openid');
    url.searchParams.set('state', state);

    return { url: url.toString(), state };
  }

  async exchangeCodeForAccessToken(code: string): Promise<LineTokenResponse> {
    const clientId = this.requireEnv('LINE_CHANNEL_ID');
    const clientSecret = this.requireEnv('LINE_CHANNEL_SECRET');
    const redirectUri = this.requireEnv('LINE_REDIRECT_URI');

    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', redirectUri);
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);

    const res = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LINE token exchange failed: ${res.status} ${text}`);
    }

    return (await res.json()) as LineTokenResponse;
  }

  async getProfile(accessToken: string): Promise<LineProfileResponse> {
    const res = await fetch('https://api.line.me/v2/profile', {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LINE get profile failed: ${res.status} ${text}`);
    }

    return (await res.json()) as LineProfileResponse;
  }

  private requireEnv(key: string) {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`${key} is required`);
    return value;
  }
}

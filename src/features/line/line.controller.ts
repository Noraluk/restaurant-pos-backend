import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { LineService } from './line.service';

@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Get('connect/url')
  getConnectUrl(@Query('state') state?: string) {
    try {
      return this.lineService.getAuthUrl({ state });
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Get('connect/callback')
  async connectCallback(
    @Query('code') code: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
    @Query('state') state?: string,
    @Query('includeToken') includeToken?: string,
  ) {
    if (error) {
      throw new BadRequestException({
        error,
        errorDescription,
        state,
      });
    }

    if (!code) {
      throw new BadRequestException({
        message: 'code is required',
        hint: 'Start via /line/connect/url to get the login URL (includes state).',
      });
    }

    let token;
    let profile;

    try {
      token = await this.lineService.exchangeCodeForAccessToken(code);
      profile = await this.lineService.getProfile(token.access_token);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    const shouldIncludeToken =
      includeToken === undefined ||
      includeToken === null ||
      includeToken === '' ||
      includeToken === '1' ||
      includeToken === 'true' ||
      includeToken === 'yes';

    const shouldOmitToken =
      includeToken === '0' || includeToken === 'false' || includeToken === 'no';

    if (!shouldIncludeToken || shouldOmitToken) return { profile };

    return {
      profile,
      token: {
        accessToken: token.access_token,
        expiresIn: token.expires_in,
        scope: token.scope,
        tokenType: token.token_type,
      },
    };
  }
}

import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { LineService } from './line.service';

@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Get('connect/url')
  getConnectUrl(@Query('state') state?: string) {
    try {
      return { url: this.lineService.getAuthUrl({ state }) };
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Get('connect/callback')
  async connectCallback(
    @Query('code') code: string,
    @Query('includeToken') includeToken?: string,
  ) {
    if (!code) throw new BadRequestException('code is required');

    let token;
    let profile;

    try {
      token = await this.lineService.exchangeCodeForAccessToken(code);
      profile = await this.lineService.getProfile(token.access_token);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    const shouldIncludeToken =
      includeToken === '1' || includeToken === 'true' || includeToken === 'yes';

    if (!shouldIncludeToken) return { profile };

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

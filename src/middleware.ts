import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { LineService } from '@/features/line/line.service';

type LineAuthUser = {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
};

function extractBearerToken(authorization: unknown): string | null {
  if (typeof authorization !== 'string') return null;
  const trimmed = authorization.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
  return token?.trim() ? token.trim() : null;
}

@Injectable()
export class LineAuthMiddleware implements NestMiddleware {
  constructor(private readonly lineService: LineService) {}

  async use(req: any, _res: any, next: (err?: any) => void) {
    const token = extractBearerToken(req?.headers?.authorization);
    if (!token) throw new UnauthorizedException('LINE authorization is required');

    try {
      const profile = await this.lineService.getProfile(token);
      const user: LineAuthUser = {
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      };
      req.lineUser = user;
      req.user = user;
      next();
    } catch (err) {
      throw new UnauthorizedException('LINE authorization is invalid');
    }
  }
}

@Injectable()
export class InternalBasicAuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: any) {
    const auth = req.header('authorization') ?? '';
    if (!auth.toLowerCase().startsWith('basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="internal"');
      return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });
    }

    const encoded = auth.slice(6).trim();
    let decoded = '';
    try {
      decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch {
      res.setHeader('WWW-Authenticate', 'Basic realm="internal"');
      return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });
    }

    const [username, password] = decoded.split(':', 2);
    if (username !== 'admin' || password !== 'admin') {
      res.setHeader('WWW-Authenticate', 'Basic realm="internal"');
      return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });
    }

    return next();
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/** Adds caller identity to public endpoints when a bearer token is present,
 * while preserving anonymous browsing. A malformed supplied token is never
 * silently ignored. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: { id: string } }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return true;
    try {
      request.user = { id: (await this.jwt.verifyAsync<{ sub: string }>(token, { secret: this.config.getOrThrow('JWT_ACCESS_SECRET') })).sub };
      return true;
    } catch {
      throw new UnauthorizedException('Access token không hợp lệ');
    }
  }
}

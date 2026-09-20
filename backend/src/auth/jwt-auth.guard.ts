import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: { id: string } }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Thiếu access token');
    try { request.user = { id: (await this.jwt.verifyAsync<{ sub: string }>(token, { secret: this.config.getOrThrow('JWT_ACCESS_SECRET') })).sub }; return true; }
    catch { throw new UnauthorizedException('Access token không hợp lệ'); }
  }
}

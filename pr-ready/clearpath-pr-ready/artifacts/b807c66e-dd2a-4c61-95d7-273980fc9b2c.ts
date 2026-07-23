import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * FIX H7: strict throttle for /auth/login and /auth/forgot-password.
 * Apply with @UseGuards(LoginThrottleGuard) + @Throttle({ default: { limit: 5, ttl: 60_000 } })
 * Keys by IP + email so credential stuffing across accounts is also limited.
 * Pair with account lockout after N failures (track failedLoginCount on User).
 */
@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = (req.body?.email ?? '').toLowerCase();
    return `${req.ip}:${email}`;
  }
}

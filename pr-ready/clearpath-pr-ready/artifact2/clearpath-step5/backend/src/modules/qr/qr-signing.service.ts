import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

/** Signs public verification references so a QR payload cannot be forged. */
@Injectable()
export class QrSigningService {
  private readonly secret: Buffer;
  constructor(config: ConfigService) {
    const value = config.get<string>('QR_SIGNING_SECRET');
    if (!value || value.length < 32) throw new Error('QR_SIGNING_SECRET must be at least 32 characters');
    this.secret = Buffer.from(value, 'utf8');
  }
  createCode(certificateId: string) {
    const nonce = randomBytes(12).toString('base64url');
    const payload = `${certificateId}.${nonce}`;
    return `${payload}.${this.sign(payload)}`;
  }
  verifyCode(code: string) {
    const parts = code.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Invalid verification code');
    const [certificateId, nonce, signature] = parts;
    const payload = `${certificateId}.${nonce}`;
    const expected = Buffer.from(this.sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new UnauthorizedException('Invalid verification code');
    return { certificateId };
  }
  private sign(payload: string) { return createHmac('sha256', this.secret).update(payload).digest('base64url'); }
}

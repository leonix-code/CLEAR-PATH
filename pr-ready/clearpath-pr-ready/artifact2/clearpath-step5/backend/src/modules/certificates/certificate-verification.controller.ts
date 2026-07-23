import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PublicVerificationService } from '../qr/public-verification.service';

/** Public endpoint used by QR codes. It returns only verification-safe fields. */
@Controller({ path: 'verify', version: '1' })
export class CertificateVerificationController {
  constructor(private readonly verification: PublicVerificationService) {}
  @Get(':code')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  verify(@Param('code') code: string) { return this.verification.verify(code); }
}

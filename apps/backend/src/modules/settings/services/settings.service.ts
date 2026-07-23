import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.prisma.systemSetting.findMany(); }
  async upsert(key: string, value: string) {
    return this.prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

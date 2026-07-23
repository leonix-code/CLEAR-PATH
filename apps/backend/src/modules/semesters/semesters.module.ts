import { Module } from '@nestjs/common';
import { SemestersController } from './controllers/semesters.controller';
import { SemestersService } from './services/semesters.service';

@Module({
  controllers: [SemestersController],
  providers: [SemestersService],
  exports: [SemestersService],
})
export class SemestersModule {}

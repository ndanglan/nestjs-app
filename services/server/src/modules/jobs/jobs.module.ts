import { Module } from '@nestjs/common';
import { CleanupService } from 'src/modules/jobs/services/cleanup.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CleanupService],
  exports: [CleanupService], // Export nếu cần sử dụng ở module khác
})
export class JobsModule {}

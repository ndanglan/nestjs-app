import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Chạy vào lúc 00:00 mỗi ngày
  async cleanupUnknownDeviceSessions() {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          deviceInfo: 'Unknown device',
          isValid: false,
        },
      });

      this.logger.log(`Đã xóa ${result.count} session với Unknown device`);
    } catch (error) {
      this.logger.error('Lỗi khi xóa Unknown device sessions:', error);
    }
  }
}

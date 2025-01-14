import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { format } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Chạy vào lúc 00:00 mỗi ngày
  async cleanupUnknownDeviceSessions() {
    try {
      const startTime = Date.now();
      this.logger.log(
        `Bắt đầu cleanup Unknown device sessions lúc ${format(
          startTime,
          'dd/MM/yyyy, HH:mm:ss',
        )}`,
      );
      const result = await this.prisma.session.deleteMany({
        where: {
          deviceInfo: 'Unknown device',
          isValid: false,
        },
      });
      const duration = Date.now() - startTime;
      this.logger.log(
        `Đã xóa ${result.count} session với Unknown device (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error('Lỗi khi xóa Unknown device sessions:', error);
      this.logger.error('Chi tiết lỗi:', {
        message: error.message,
        stack: error.stack,
      });
    }
  }
}

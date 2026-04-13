import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamSchedulerService {
  private readonly logger = new Logger(ExamSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async closeExpiredRegistrations() {
    this.logger.debug('[RegistrationClosure] Starting scan...');

    const activeTenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const tenant of activeTenants) {
      try {
        await PrismaService.runInTenantContext(tenant.schemaName, async () => {
          const openExams = await this.prisma.exam.findMany({
            where: { status: 'OPEN' },
          });

          const now = new Date();
          let closedCount = 0;

          for (const exam of openExams) {
            if (exam.registrationEnd && exam.registrationEnd < now) {
              await this.prisma.exam.update({
                where: { id: exam.id },
                data: { status: 'CLOSED' },
              });
              closedCount++;
              this.logger.log(
                `[RegistrationClosure] Closed exam: ${exam.code} in tenant: ${tenant.code}`,
              );
            }
          }

          if (closedCount > 0) {
            this.logger.log(
              `[RegistrationClosure] Tenant ${tenant.code}: Closed ${closedCount} exams`,
            );
          }
        });
      } catch (error) {
        this.logger.error(
          `[RegistrationClosure] Error processing tenant ${tenant.code}: ${(error as Error).message}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async runAutoSeating() {
    this.logger.debug('[AutoSeating] Starting auto seating scheduler');

    const activeTenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const tenant of activeTenants) {
      try {
        await PrismaService.runInTenantContext(tenant.schemaName, async () => {
          const closedExams = await this.prisma.exam.findMany({
            where: { status: 'CLOSED' },
          });

          for (const exam of closedExams) {
            const existing = await this.prisma.seatAssignment.findFirst({
              where: { examId: exam.id },
            });

            if (!existing) {
              this.logger.log(
                `[AutoSeating] Found closed exam ${exam.code} in tenant ${tenant.code} requiring allocation`,
              );
            }
          }
        });
      } catch (error) {
        this.logger.error(
          `[AutoSeating] Error processing tenant ${tenant.code}: ${(error as Error).message}`,
        );
      }
    }
  }
}

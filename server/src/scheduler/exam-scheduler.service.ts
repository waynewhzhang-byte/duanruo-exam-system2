import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamSchedulerService {
  private readonly logger = new Logger(ExamSchedulerService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * 自动关闭报名定时任务 (每 5 分钟执行一次)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async closeExpiredRegistrations() {
    this.logger.debug('[RegistrationClosure] Starting scan...');

    const activeTenants = await this.prisma.client.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const tenant of activeTenants) {
      try {
        await this.prisma.client.$transaction(
          async (tx) => {
            // Switch to tenant schema
            await tx.$executeRawUnsafe(
              `SET search_path TO "${tenant.schemaName}", public`,
            );

            const openExams = await tx.exam.findMany({
              where: { status: 'OPEN' },
            });

            const now = new Date();
            let closedCount = 0;

            for (const exam of openExams) {
              if (exam.registrationEnd && exam.registrationEnd < now) {
                await tx.exam.update({
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
          },
          { timeout: 30000 },
        );
      } catch (error) {
        this.logger.error(
          `[RegistrationClosure] Error processing tenant ${tenant.code}: ${(error as Error).message}`,
        );
      }
    }
  }

  /**
   * 自动分配座位 (每 10 分钟执行一次)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async runAutoSeating() {
    this.logger.debug('[AutoSeating] Starting auto seating scheduler');

    const activeTenants = await this.prisma.client.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const tenant of activeTenants) {
      try {
        // Here we don't use nested transaction if SeatingService already uses one
        // Instead, we set schema context and call the service
        await PrismaService.runInTenantContext(tenant.schemaName, async () => {
          // Since SeatingService.allocate uses this.client (which is prisma.client),
          // we need to ensure that client actually uses the search_path.
          // Note: In our previous implementation of PrismaService, the extension
          // didn't actually run SET search_path.
          // For now, let's do manual schema switching in the scheduler for simplicity.

          await this.prisma.client.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(
              `SET search_path TO "${tenant.schemaName}", public`,
            );

            const closedExams = await tx.exam.findMany({
              where: { status: 'CLOSED' },
            });

            for (const exam of closedExams) {
              const existing = await tx.seatAssignment.findFirst({
                where: { examId: exam.id },
              });

              if (!existing) {
                // Call allocation logic (we might need to refactor SeatingService to accept 'tx')
                // For now, let's just log and assume manual trigger or future refactor
                this.logger.log(
                  `[AutoSeating] Found closed exam ${exam.code} in tenant ${tenant.code} requiring allocation`,
                );

                // TODO: Issue tickets logic would go here
              }
            }
          });
        });
      } catch (error) {
        this.logger.error(
          `[AutoSeating] Error processing tenant ${tenant.code}: ${(error as Error).message}`,
        );
      }
    }
  }
}

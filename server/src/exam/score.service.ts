import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../common/notification/notification.service';
import { NotificationChannel } from '../common/notification/notification.interface';
import { RecordScoreDto, BatchScoreDto, UpdateInterviewResultDto } from './dto/score.dto';

@Injectable()
export class ScoreService {
  private readonly logger = new Logger(ScoreService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * 获取某报名者的所有成绩
   */
  async getScoresByApplication(applicationId: string) {
    return this.prisma.examScore.findMany({
      where: { applicationId },
      orderBy: { subjectId: 'asc' },
    });
  }

  /**
   * 录入成绩
   */
  async recordScore(recorderId: string, dto: RecordScoreDto): Promise<any> {
    // 检查报名是否存在
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: { exam: true, position: true },
    });

    if (!application) {
      throw new NotFoundException('报名不存在');
    }

    // 检查是否已有该科目成绩
    const existingScore = await this.prisma.examScore.findUnique({
      where: {
        applicationId_subjectId: {
          applicationId: dto.applicationId,
          subjectId: dto.subjectId,
        },
      },
    });

    let score;
    if (existingScore) {
      // 更新成绩
      score = await this.prisma.examScore.update({
        where: { id: existingScore.id },
        data: {
          score: dto.score ?? null,
          isAbsent: dto.isAbsent ?? false,
          remarks: dto.remarks,
          recordedBy: recorderId,
        },
      });
    } else {
      // 创建成绩
      score = await this.prisma.examScore.create({
        data: {
          applicationId: dto.applicationId,
          subjectId: dto.subjectId,
          candidateId: dto.candidateId,
          examId: dto.examId,
          positionId: dto.positionId,
          score: dto.score ?? null,
          isAbsent: dto.isAbsent ?? false,
          remarks: dto.remarks,
          recordedBy: recorderId,
        },
      });
    }

    // 触发成绩更新，重新计算面试资格
    await this.calculateInterviewEligibility(dto.applicationId);

    return score;
  }

  /**
   * 批量导入成绩
   */
  async batchImportScores(
    importerId: string,
    examId: string,
    scores: BatchScoreDto[],
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    // 获取考试信息和岗位
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { positions: { include: { subjects: true } } },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    for (const dto of scores) {
      try {
        // 获取报名信息
        const application = await this.prisma.application.findUnique({
          where: { id: dto.applicationId },
        });

        if (!application) {
          errors.push(`报名 ${dto.applicationId} 不存在`);
          continue;
        }

        await this.recordScore(importerId, {
          applicationId: dto.applicationId,
          subjectId: dto.subjectId,
          candidateId: application.candidateId,
          examId: examId,
          positionId: application.positionId,
          score: dto.score,
          isAbsent: false,
          remarks: dto.remarks,
        });
        success++;
      } catch (error) {
        errors.push(`报名 ${dto.applicationId}: ${error.message}`);
      }
    }

    return { success, failed: scores.length - success, errors };
  }

  /**
   * 计算面试资格 - 核心业务逻辑
   */
  async calculateInterviewEligibility(applicationId: string): Promise<void> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        exam: { include: { positions: { include: { subjects: true } } } },
        position: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // 获取该考生所有科目成绩
    const scores = await this.prisma.examScore.findMany({
      where: { applicationId },
    });

    // 计算笔试总分
    const totalScore = scores.reduce((sum: number, s: any) => {
      if (s.isAbsent) return sum;
      return sum + Number(s.score || 0);
    }, 0);

    // 获取该岗位的合格线（默认60分）
    const passScore = Number(application.writtenPassScore || 60);

    // 判断笔试是否通过
    let writtenPassStatus: string;
    let interviewEligibility: string;

    if (scores.length === 0) {
      writtenPassStatus = 'PENDING';
      interviewEligibility = 'PENDING';
    } else if (scores.some((s: any) => s.isAbsent)) {
      // 有缺考科目，视为不通过
      writtenPassStatus = 'FAIL';
      interviewEligibility = 'INELIGIBLE';
    } else if (totalScore >= passScore) {
      writtenPassStatus = 'PASS';
      interviewEligibility = 'ELIGIBLE';
    } else {
      writtenPassStatus = 'FAIL';
      interviewEligibility = 'INELIGIBLE';
    }

    // 保存旧的面试资格状态（用于判断是否需要发送通知）
    const oldEligibility = application.interviewEligibility;

    // 更新报名表的面试资格
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        totalWrittenScore: totalScore,
        writtenPassStatus,
        interviewEligibility,
        finalResult: interviewEligibility === 'ELIGIBLE' ? '进入面试' : '笔试未通过',
      },
    });

    // 如果面试资格从非 ELIGIBLE 变为 ELIGIBLE，发送通知
    if (oldEligibility !== 'ELIGIBLE' && interviewEligibility === 'ELIGIBLE') {
      await this.notifyInterviewEligibility(applicationId);
    }
  }

  /**
   * 批量计算所有报名者的面试资格
   */
  async batchCalculateEligibility(
    examId: string,
    passScore?: number,
  ): Promise<{ processed: number; passed: number; failed: number }> {
    // 先更新合格线
    if (passScore) {
      await this.prisma.application.updateMany({
        where: { examId },
        data: { writtenPassScore: passScore },
      });
    }

    const applications = await this.prisma.application.findMany({
      where: { 
        examId, 
        status: { in: ['APPROVED', 'TICKET_ISSUED'] },
      },
    });

    let passed = 0;
    let failed = 0;

    for (const app of applications) {
      try {
        await this.calculateInterviewEligibility(app.id);
        const updated = await this.prisma.application.findUnique({
          where: { id: app.id },
        });
        if (updated?.interviewEligibility === 'ELIGIBLE') {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.error(`计算报名 ${app.id} 面试资格失败: ${error.message}`);
        failed++;
      }
    }

    return { processed: applications.length, passed, failed };
  }

  /**
   * 更新面试结果
   */
  async updateInterviewResult(
    updaterId: string,
    dto: UpdateInterviewResultDto,
  ): Promise<any> {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: { exam: true, position: true },
    });

    if (!application) {
      throw new NotFoundException('报名不存在');
    }

    // 更新面试结果 - 存储在 Application 表中
    const updated = await this.prisma.application.update({
      where: { id: dto.applicationId },
      data: {
        finalResult: dto.finalResult,
        interviewTime: dto.interviewTime ? new Date(dto.interviewTime) : null,
        interviewLocation: dto.interviewLocation,
        interviewRoom: dto.interviewRoom,
      },
    });

    // 发送面试结果通知
    if (dto.finalResult) {
      await this.notifyInterviewResult(dto.applicationId, dto.finalResult);
    }

    return updated;
  }

  /**
   * 获取成绩统计
   */
  async getStatistics(examId: string): Promise<any> {
    const applications = await this.prisma.application.findMany({
      where: { examId, status: { in: ['APPROVED', 'TICKET_ISSUED'] } },
      include: { scores: true },
    });

    const scores = applications.flatMap((app: any) => app.scores.filter((s: any) => !s.isAbsent));
    const totalCandidates = applications.length;
    const scoredCandidates = new Set(scores.map((s: any) => s.applicationId)).size;
    
    const totalScoreSum = scores.reduce((sum: number, s: any) => sum + Number(s.score || 0), 0);
    const averageScore = scoredCandidates > 0 ? totalScoreSum / scoredCandidates : 0;
    
    const passCount = applications.filter((app: any) => app.writtenPassStatus === 'PASS').length;
    const failCount = applications.filter((app: any) => app.writtenPassStatus === 'FAIL').length;
    const pendingCount = applications.filter((app: any) => app.writtenPassStatus === 'PENDING').length;

    return {
      totalCandidates,
      scoredCandidates,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore: scores.length > 0 ? Math.max(...scores.map((s: any) => Number(s.score || 0))) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores.filter((s: any) => s.score).map((s: any) => Number(s.score))) : 0,
      passCount,
      failCount,
      pendingCount,
      passRate: totalCandidates > 0 ? Math.round(passCount / totalCandidates * 10000) / 100 : 0,
    };
  }

  /**
   * 导出成绩单
   */
  async exportScores(examId: string): Promise<{ downloadUrl: string }> {
    const applications = await this.prisma.application.findMany({
      where: { examId },
      include: {
        exam: true,
        position: true,
        scores: true,
      },
    });

    // 这里可以生成 Excel/CSV，实际实现可以使用 xlsx 库
    // 返回下载链接（模拟）
    return {
      downloadUrl: `/api/v1/scores/export/${examId}`,
    };
  }

  /**
   * 发送面试资格通知
   */
  private async notifyInterviewEligibility(applicationId: string): Promise<void> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        exam: true,
        position: true,
      },
    });

    if (!application) return;

    // 获取考生用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: application.candidateId },
    });

    if (!user) return;

    // 发送邮件通知
    try {
      await this.notificationService.send(NotificationChannel.EMAIL, {
        to: user.email,
        subject: `【面试资格通知】${application.exam.title} - 笔试成绩已公布`,
        data: {
          fullName: user.fullName,
          examTitle: application.exam.title,
          positionTitle: application.position.title,
          result: '通过',
          totalScore: application.totalWrittenScore,
          message: `恭喜！您已通过${application.exam.title}的笔试考核，进入面试环节。请留意后续面试安排通知。`,
        },
      });
    } catch (error) {
      this.logger.error(`发送邮件通知失败: ${error.message}`);
    }

    // 记录通知到数据库
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'INTERVIEW_ELIGIBILITY',
        title: '面试资格通知',
        content: `您已通过${application.exam.title}笔试，进入面试环节`,
        channel: 'EMAIL',
        status: 'SENT',
        sentAt: new Date(),
        relatedId: applicationId,
        relatedType: 'application',
      },
    });
  }

  /**
   * 发送面试结果通知
   */
  private async notifyInterviewResult(
    applicationId: string,
    finalResult: string,
  ): Promise<void> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        exam: true,
        position: true,
      },
    });

    if (!application) return;

    const user = await this.prisma.user.findUnique({
      where: { id: application.candidateId },
    });

    if (!user) return;

    const isPassed = finalResult === '面试通过';

    try {
      await this.notificationService.send(NotificationChannel.EMAIL, {
        to: user.email,
        subject: `【面试结果通知】${application.exam.title}`,
        data: {
          fullName: user.fullName,
          examTitle: application.exam.title,
          positionTitle: application.position.title,
          result: isPassed ? '通过' : '未通过',
          message: isPassed
            ? `恭喜！您已通过${application.exam.title}的面试考核。`
            : `抱歉，您在${application.exam.title}的面试中未通过。`,
        },
      });
    } catch (error) {
      this.logger.error(`发送邮件通知失败: ${error.message}`);
    }

    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'INTERVIEW_RESULT',
        title: '面试结果通知',
        content: `${application.exam.title}面试结果: ${finalResult}`,
        channel: 'EMAIL',
        status: 'SENT',
        sentAt: new Date(),
        relatedId: applicationId,
        relatedType: 'application',
      },
    });
  }
}

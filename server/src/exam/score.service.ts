import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../common/notification/notification.service';
import { NotificationChannel } from '../common/notification/notification.interface';
import { getErrorMessage } from '../common/utils/error.util';
import type { Application, ExamScore } from '@prisma/client';
import {
  RecordScoreDto,
  BatchScoreDto,
  UpdateInterviewResultDto,
  ScoreExamStatistics,
} from './dto/score.dto';

@Injectable()
export class ScoreService {
  private readonly logger = new Logger(ScoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private get client() {
    return this.prisma.client;
  }

  /**
   * 生成导入模板 (CSV)
   */
  async generateImportTemplate(examId: string): Promise<string> {
    const exam = await this.client.exam.findUnique({
      where: { id: examId },
      include: { positions: { include: { subjects: true } } },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const applications = await this.client.application.findMany({
      where: { examId, status: { in: ['APPROVED', 'TICKET_ISSUED'] } },
      select: {
        id: true,
        payload: true,
        candidateId: true,
        positionId: true,
      },
    });

    // 获取所有用户全名以增强模板可读性
    const candidateIds = applications.map((a) => a.candidateId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    // CSV 表头
    let csv = '\ufeff报名ID,姓名,岗位,科目ID,科目名称,分数,备注\n';

    for (const app of applications) {
      const position = exam.positions.find((p) => p.id === app.positionId);
      if (!position) continue;

      const candidateName = userMap.get(app.candidateId) || '未知考生';

      for (const subject of position.subjects) {
        csv += `${app.id},${candidateName},${position.title},${subject.id},${subject.name},,\n`;
      }
    }

    return csv;
  }

  /**
   * 获取报名信息用于权限校验（仅返回 candidateId）
   */
  async getApplicationForAuth(applicationId: string) {
    const app = await this.client.application.findUnique({
      where: { id: applicationId },
      select: { candidateId: true },
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  /**
   * 获取某报名者的所有成绩
   */
  async getScoresByApplication(applicationId: string) {
    return this.client.examScore.findMany({
      where: { applicationId },
      orderBy: { subjectId: 'asc' },
    });
  }

  /** 某场考试下全部成绩记录（管理端） */
  async getScoresByExam(examId: string) {
    return this.client.examScore.findMany({
      where: { examId },
      orderBy: [{ applicationId: 'asc' }, { subjectId: 'asc' }],
    });
  }

  /**
   * 录入成绩
   */
  async recordScore(
    recorderId: string,
    dto: RecordScoreDto,
  ): Promise<ExamScore> {
    // 检查报名是否存在
    const application = await this.client.application.findUnique({
      where: { id: dto.applicationId },
      include: { exam: true, position: true },
    });

    if (!application) {
      throw new NotFoundException('报名不存在');
    }

    const candidateId = dto.candidateId ?? application.candidateId;
    const examId = dto.examId ?? application.examId;
    const positionId = dto.positionId ?? application.positionId;

    const existingScore = await this.client.examScore.findUnique({
      where: {
        applicationId_subjectId: {
          applicationId: dto.applicationId,
          subjectId: dto.subjectId,
        },
      },
    });

    let score: ExamScore;
    if (existingScore) {
      score = await this.client.examScore.update({
        where: { id: existingScore.id },
        data: {
          score: dto.score ?? null,
          isAbsent: dto.isAbsent ?? false,
          remarks: dto.remarks,
          recordedBy: recorderId,
        },
      });
    } else {
      score = await this.client.examScore.create({
        data: {
          applicationId: dto.applicationId,
          subjectId: dto.subjectId,
          candidateId,
          examId,
          positionId,
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
    const exam = await this.client.exam.findUnique({
      where: { id: examId },
      include: { positions: { include: { subjects: true } } },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    for (const dto of scores) {
      try {
        const application = await this.client.application.findUnique({
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
        errors.push(`报名 ${dto.applicationId}: ${getErrorMessage(error)}`);
      }
    }

    return { success, failed: scores.length - success, errors };
  }

  /**
   * 计算面试资格 - 核心业务逻辑
   */
  async calculateInterviewEligibility(applicationId: string): Promise<void> {
    const application = await this.client.application.findUnique({
      where: { id: applicationId },
      include: {
        exam: { include: { positions: { include: { subjects: true } } } },
        position: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const scores = await this.client.examScore.findMany({
      where: { applicationId },
    });

    // 计算笔试总分
    const totalScore = scores.reduce((sum: number, s: ExamScore) => {
      if (s.isAbsent) return sum;
      return sum + Number(s.score ?? 0);
    }, 0);

    // 获取该岗位的合格线（默认60分）
    const passScore = Number(application.writtenPassScore || 60);

    // 判断笔试是否通过
    let writtenPassStatus: string;
    let interviewEligibility: string;

    if (scores.length === 0) {
      writtenPassStatus = 'PENDING';
      interviewEligibility = 'PENDING';
    } else if (scores.some((s: ExamScore) => s.isAbsent)) {
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

    const oldEligibility = application.interviewEligibility;

    await this.client.application.update({
      where: { id: applicationId },
      data: {
        totalWrittenScore: totalScore,
        writtenPassStatus,
        interviewEligibility,
        finalResult:
          interviewEligibility === 'ELIGIBLE' ? '进入面试' : '笔试未通过',
      },
    });

    // 如果面试资格从非 ELIGIBLE 变为 ELIGIBLE，发送通知
    if (oldEligibility !== 'ELIGIBLE' && interviewEligibility === 'ELIGIBLE') {
      await this.notifyInterviewEligibility(applicationId);
    }
  }

  async batchCalculateEligibility(
    examId: string,
    passScore?: number,
  ): Promise<{ processed: number; passed: number; failed: number }> {
    if (passScore) {
      await this.client.application.updateMany({
        where: { examId },
        data: { writtenPassScore: passScore },
      });
    }

    const applications = await this.client.application.findMany({
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
        const updated = await this.client.application.findUnique({
          where: { id: app.id },
        });
        if (updated?.interviewEligibility === 'ELIGIBLE') {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.error(
          `计算报名 ${app.id} 面试资格失败: ${getErrorMessage(error)}`,
        );
        failed++;
      }
    }

    return { processed: applications.length, passed, failed };
  }

  async updateInterviewResult(
    _updaterId: string,
    dto: UpdateInterviewResultDto,
  ): Promise<Application> {
    const application = await this.client.application.findUnique({
      where: { id: dto.applicationId },
      include: { exam: true, position: true },
    });

    if (!application) {
      throw new NotFoundException('报名不存在');
    }

    const updated = await this.client.application.update({
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

  async getStatistics(examId: string): Promise<ScoreExamStatistics> {
    const applications = (await this.client.application.findMany({
      where: { examId, status: { in: ['APPROVED', 'TICKET_ISSUED'] } },
      include: { scores: true },
    })) as Array<Application & { scores: ExamScore[] }>;

    const scores = applications.flatMap((app) =>
      app.scores.filter((s) => !s.isAbsent),
    );
    const totalCandidates = applications.length;
    const scoredCandidates = new Set(scores.map((s) => s.applicationId)).size;

    const totalScoreSum = scores.reduce(
      (sum: number, s: ExamScore) => sum + Number(s.score ?? 0),
      0,
    );
    const averageScore =
      scoredCandidates > 0 ? totalScoreSum / scoredCandidates : 0;

    const passCount = applications.filter(
      (app) => app.writtenPassStatus === 'PASS',
    ).length;
    const failCount = applications.filter(
      (app) => app.writtenPassStatus === 'FAIL',
    ).length;
    const pendingCount = applications.filter(
      (app) => app.writtenPassStatus === 'PENDING',
    ).length;

    return {
      totalCandidates,
      scoredCandidates,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore:
        scores.length > 0
          ? Math.max(...scores.map((s) => Number(s.score ?? 0)))
          : 0,
      lowestScore:
        scores.length > 0
          ? Math.min(
              ...scores
                .filter((s) => s.score != null)
                .map((s) => Number(s.score)),
            )
          : 0,
      passCount,
      failCount,
      pendingCount,
      passRate:
        totalCandidates > 0
          ? Math.round((passCount / totalCandidates) * 10000) / 100
          : 0,
    };
  }

  /**
   * Rankings for an exam (total written score per application), optional position filter.
   * Shape aligned with web `ScoreRankingResponse`.
   */
  async getExamRanking(examId: string, positionId?: string) {
    const applications = await this.client.application.findMany({
      where: {
        examId,
        ...(positionId ? { positionId } : {}),
      },
      include: {
        position: true,
        scores: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const userIds = [...new Set(applications.map((a) => a.candidateId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    });
    const userMap = new Map(
      users.map((u) => [
        u.id,
        {
          fullName: u.fullName,
          idCard: u.profile?.idNumber ?? '',
        },
      ]),
    );

    const tickets = await this.client.ticket.findMany({
      where: { examId },
      select: { applicationId: true, ticketNo: true },
    });
    const ticketMap = new Map(
      tickets.map((t) => [t.applicationId, t.ticketNo]),
    );

    const totalCandidates = applications.length;

    const rows = applications.map((app) => {
      const totalScore = app.scores.reduce((sum, s) => {
        if (s.isAbsent) return sum;
        return sum + Number(s.score ?? 0);
      }, 0);
      const u = userMap.get(app.candidateId);
      return {
        applicationId: app.id,
        candidateName: u?.fullName ?? '',
        idCard: u?.idCard ?? '',
        ticketNo: ticketMap.get(app.id) ?? null,
        positionId: app.positionId,
        positionName: app.position.title,
        totalScore,
        rank: 0,
        isTied: false,
        isInterviewEligible: app.interviewEligibility === 'ELIGIBLE',
        totalCandidates,
      };
    });

    rows.sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        a.applicationId.localeCompare(b.applicationId),
    );

    for (let i = 0; i < rows.length; i++) {
      if (i === 0) {
        rows[i].rank = 1;
      } else if (rows[i].totalScore === rows[i - 1].totalScore) {
        rows[i].rank = rows[i - 1].rank;
      } else {
        rows[i].rank = i + 1;
      }
      rows[i].isTied = i > 0 && rows[i].totalScore === rows[i - 1].totalScore;
    }

    return rows;
  }

  async exportScores(examId: string): Promise<{ downloadUrl: string }> {
    const _applications = await this.client.application.findMany({
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

  private async notifyInterviewEligibility(
    applicationId: string,
  ): Promise<void> {
    const application = await this.client.application.findUnique({
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
      this.logger.error(`发送邮件通知失败: ${getErrorMessage(error)}`);
    }

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

  private async notifyInterviewResult(
    applicationId: string,
    finalResult: string,
  ): Promise<void> {
    const application = await this.client.application.findUnique({
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
      this.logger.error(`发送邮件通知失败: ${getErrorMessage(error)}`);
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

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Position, Subject } from '@prisma/client';
import { PositionCreateRequest, PositionResponse } from './dto/position.dto';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.client;
  }

  async findByExamId(examId: string): Promise<PositionResponse[]> {
    const positions = await this.client.position.findMany({
      where: { examId },
      include: { subjects: { orderBy: { ordering: 'asc' } } },
    });
    return positions.map((p) => this.mapToResponse(p));
  }

  async create(request: PositionCreateRequest): Promise<PositionResponse> {
    const exam = await this.client.exam.findUnique({
      where: { id: request.examId },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const existing = await this.client.position.findFirst({
      where: { examId: request.examId, code: request.code },
    });
    if (existing)
      throw new BadRequestException(
        'Position code already exists for this exam',
      );

    const position = await this.client.position.create({
      data: {
        examId: request.examId,
        code: request.code,
        title: request.title,
        description: request.description,
        requirements: request.requirements,
        quota: request.quota,
        subjects: {
          create:
            request.subjects?.map((s) => ({
              name: s.name,
              durationMinutes: s.durationMinutes,
              type: s.type,
              maxScore: s.maxScore,
              passingScore: s.passingScore,
              weight: s.weight ?? 1.0,
              ordering: s.ordering ?? 0,
            })) || [],
        },
      },
      include: { subjects: true },
    });

    return this.mapToResponse(position);
  }

  async delete(id: string): Promise<void> {
    const position = await this.client.position.findUnique({ where: { id } });
    if (!position) throw new NotFoundException('Position not found');

    // Check for applications
    const hasApps = await this.client.application.findFirst({
      where: { positionId: id },
    });
    if (hasApps)
      throw new BadRequestException(
        'Cannot delete position with existing applications',
      );

    await this.client.position.delete({ where: { id } });
  }

  private mapToResponse(
    position: Position & { subjects?: Subject[] },
  ): PositionResponse {
    return {
      id: position.id,
      examId: position.examId,
      code: position.code,
      title: position.title,
      description: position.description || undefined,
      requirements: position.requirements || undefined,
      quota: position.quota || undefined,
      subjects: position.subjects?.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        type: s.type,
        maxScore: s.maxScore ? Number(s.maxScore) : undefined,
        passingScore: s.passingScore ? Number(s.passingScore) : undefined,
        weight: Number(s.weight),
        ordering: s.ordering,
        createdAt: s.createdAt,
      })),
      createdAt: position.createdAt,
    };
  }
}

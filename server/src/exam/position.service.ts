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

  async findById(id: string): Promise<PositionResponse> {
    const position = await this.client.position.findUnique({
      where: { id },
      include: { subjects: { orderBy: { ordering: 'asc' } } },
    });
    if (!position) throw new NotFoundException('Position not found');
    return this.mapToResponse(position);
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

  async getSubjects(positionId: string) {
    const position = await this.client.position.findUnique({
      where: { id: positionId },
      include: { subjects: { orderBy: { ordering: 'asc' } } },
    });
    if (!position) throw new NotFoundException('Position not found');
    return position.subjects;
  }

  async createSubject(positionId: string, data: {
    name: string;
    type: string;
    durationMinutes?: number;
    maxScore?: number;
    passingScore?: number;
    weight?: number;
    ordering?: number;
  }) {
    const position = await this.client.position.findUnique({
      where: { id: positionId },
    });
    if (!position) throw new NotFoundException('Position not found');

    return await this.client.subject.create({
      data: {
        positionId,
        name: data.name,
        type: data.type,
        durationMinutes: data.durationMinutes ?? 0,
        maxScore: data.maxScore ?? 100,
        passingScore: data.passingScore ?? 60,
        weight: data.weight ?? 1.0,
        ordering: data.ordering ?? 0,
      },
    });
  }

  async updateSubject(id: string, data: {
    name?: string;
    type?: string;
    durationMinutes?: number;
    maxScore?: number;
    passingScore?: number;
    weight?: number;
    ordering?: number;
  }) {
    const subject = await this.client.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    return await this.client.subject.update({
      where: { id },
      data: {
        name: data.name ?? subject.name,
        type: data.type ?? subject.type,
        durationMinutes: data.durationMinutes ?? subject.durationMinutes,
        maxScore: data.maxScore ?? subject.maxScore,
        passingScore: data.passingScore ?? subject.passingScore,
        weight: data.weight ?? subject.weight,
        ordering: data.ordering ?? subject.ordering,
      },
    });
  }

  async deleteSubject(id: string) {
    const subject = await this.client.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    await this.client.subject.delete({ where: { id } });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    requirements?: any;
    quota?: number;
  }): Promise<PositionResponse> {
    const position = await this.client.position.findUnique({ where: { id } });
    if (!position) throw new NotFoundException('Position not found');

    const updated = await this.client.position.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        quota: data.quota,
      },
      include: { subjects: true },
    });

    return this.mapToResponse(updated);
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

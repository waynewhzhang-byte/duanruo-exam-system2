import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PiiService, PiiType } from '../common/pii/pii.service';
import { UserProfile, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsString()
  politicalStatus?: string;

  @IsOptional()
  @IsString()
  hukouLocation?: string;

  @IsOptional()
  @IsString()
  workExperience?: string;

  @IsOptional()
  @IsString()
  photoId?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsInt()
  graduateYear?: number;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  currentCompany?: string;

  @IsOptional()
  @IsString()
  currentPosition?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  customFields?: Prisma.InputJsonValue;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsString()
  politicalStatus?: string;

  @IsOptional()
  @IsString()
  hukouLocation?: string;

  @IsOptional()
  @IsString()
  workExperience?: string;

  @IsOptional()
  @IsString()
  photoId?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsInt()
  graduateYear?: number;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  currentCompany?: string;

  @IsOptional()
  @IsString()
  currentPosition?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  customFields?: Prisma.InputJsonValue;
}

export interface ProfileResponse {
  id: string;
  userId: string;
  gender?: string | null;
  birthDate?: string | null;
  idNumber?: string | null;
  politicalStatus?: string | null;
  hukouLocation?: string | null;
  workExperience?: string | null;
  photoId?: string | null;
  education?: string | null;
  major?: string | null;
  graduateYear?: number | null;
  university?: string | null;
  currentCompany?: string | null;
  currentPosition?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  address?: string | null;
  customFields?: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly piiService: PiiService,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponse | null> {
    const profile = await this.prisma.publicClient.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    return this.mapToResponse(profile);
  }

  async upsertProfile(
    userId: string,
    dto: CreateProfileDto,
  ): Promise<ProfileResponse> {
    const existingProfile =
      await this.prisma.publicClient.userProfile.findUnique({
        where: { userId },
      });

    const baseData = {
      gender: dto.gender ?? null,
      politicalStatus: dto.politicalStatus ?? null,
      hukouLocation: dto.hukouLocation ?? null,
      workExperience: dto.workExperience ?? null,
      photoId: dto.photoId ?? null,
      education: dto.education ?? null,
      major: dto.major ?? null,
      graduateYear: dto.graduateYear ?? null,
      university: dto.university ?? null,
      currentCompany: dto.currentCompany ?? null,
      currentPosition: dto.currentPosition ?? null,
      emergencyContact: dto.emergencyContact ?? null,
      emergencyPhone: dto.emergencyPhone ?? null,
      address: dto.address ?? null,
      customFields: dto.customFields ?? Prisma.JsonNull,
    };

    if (dto.idNumber !== undefined && dto.idNumber !== '') {
      (baseData as Record<string, unknown>).idNumber = this.piiService.encrypt(
        dto.idNumber,
      );
      (baseData as Record<string, unknown>).idNumberEncrypted = true;
    }

    if (dto.birthDate !== undefined && dto.birthDate !== '') {
      (baseData as Record<string, unknown>).birthDate = new Date(dto.birthDate);
    }

    let profile: UserProfile;
    if (existingProfile) {
      profile = await this.prisma.publicClient.userProfile.update({
        where: { userId },
        data: baseData as Prisma.UserProfileUncheckedUpdateInput,
      });
    } else {
      profile = await this.prisma.publicClient.userProfile.create({
        data: {
          id: uuidv4(),
          userId,
          ...baseData,
        } as Prisma.UserProfileUncheckedCreateInput,
      });
    }

    return this.mapToResponse(profile);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const existingProfile =
      await this.prisma.publicClient.userProfile.findUnique({
        where: { userId },
      });

    if (!existingProfile) {
      throw new NotFoundException('用户档案不存在');
    }

    const data: Prisma.UserProfileUncheckedUpdateInput = {};

    if (dto.gender !== undefined) data.gender = dto.gender ?? null;
    if (dto.politicalStatus !== undefined)
      data.politicalStatus = dto.politicalStatus ?? null;
    if (dto.hukouLocation !== undefined)
      data.hukouLocation = dto.hukouLocation ?? null;
    if (dto.workExperience !== undefined)
      data.workExperience = dto.workExperience ?? null;
    if (dto.photoId !== undefined) data.photoId = dto.photoId ?? null;
    if (dto.education !== undefined) data.education = dto.education ?? null;
    if (dto.major !== undefined) data.major = dto.major ?? null;
    if (dto.graduateYear !== undefined)
      data.graduateYear = dto.graduateYear ?? null;
    if (dto.university !== undefined) data.university = dto.university ?? null;
    if (dto.currentCompany !== undefined)
      data.currentCompany = dto.currentCompany ?? null;
    if (dto.currentPosition !== undefined)
      data.currentPosition = dto.currentPosition ?? null;
    if (dto.emergencyContact !== undefined)
      data.emergencyContact = dto.emergencyContact ?? null;
    if (dto.emergencyPhone !== undefined)
      data.emergencyPhone = dto.emergencyPhone ?? null;
    if (dto.address !== undefined) data.address = dto.address ?? null;
    if (dto.customFields !== undefined)
      data.customFields = dto.customFields ?? Prisma.JsonNull;

    if (dto.idNumber !== undefined) {
      if (dto.idNumber && dto.idNumber.trim() !== '') {
        data.idNumber = this.piiService.encrypt(dto.idNumber);
        data.idNumberEncrypted = true;
      } else {
        data.idNumber = null;
        data.idNumberEncrypted = false;
      }
    }

    if (dto.birthDate !== undefined) {
      data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    }

    const profile = await this.prisma.publicClient.userProfile.update({
      where: { userId },
      data,
    });

    return this.mapToResponse(profile);
  }

  async deleteProfile(userId: string): Promise<void> {
    const existingProfile =
      await this.prisma.publicClient.userProfile.findUnique({
        where: { userId },
      });

    if (!existingProfile) {
      throw new NotFoundException('用户档案不存在');
    }

    await this.prisma.publicClient.userProfile.delete({
      where: { userId },
    });
  }

  async getMaskedProfile(
    userId: string,
  ): Promise<Partial<ProfileResponse> | null> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return null;
    }

    const masked = { ...profile };

    if (masked.idNumber) {
      masked.idNumber = this.piiService.mask(masked.idNumber, PiiType.ID_CARD);
    }

    return masked;
  }

  private mapToResponse(profile: UserProfile): ProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      gender: profile.gender,
      birthDate: profile.birthDate?.toISOString() ?? null,
      idNumber: profile.idNumber,
      politicalStatus: profile.politicalStatus,
      hukouLocation: profile.hukouLocation,
      workExperience: profile.workExperience,
      photoId: profile.photoId,
      education: profile.education,
      major: profile.major,
      graduateYear: profile.graduateYear,
      university: profile.university,
      currentCompany: profile.currentCompany,
      currentPosition: profile.currentPosition,
      emergencyContact: profile.emergencyContact,
      emergencyPhone: profile.emergencyPhone,
      address: profile.address,
      customFields: profile.customFields,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}

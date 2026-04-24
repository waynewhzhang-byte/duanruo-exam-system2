export class PublicExamResponse {
  id!: string;
  examId!: string;
  tenantId!: string;
  tenantName?: string;
  tenantCode?: string;
  code!: string;
  title!: string;
  description?: string;
  announcement?: string;
  registrationStart?: Date;
  registrationEnd?: Date;
  examStart?: Date;
  examEnd?: Date;
  feeRequired?: boolean;
  feeAmount?: number;
  status!: string;
  positionCount?: number;
  updatedAt?: Date;
}

export class PublicExamAnnouncementResponse {
  content!: string;
}

import { IsUUID, IsArray, IsOptional, IsString } from 'class-validator';

export class GenerateTicketRequest {
  @IsUUID()
  applicationId: string;
}

export class BatchGenerateTicketsRequest {
  @IsArray()
  @IsUUID(undefined, { each: true })
  applicationIds: string[];
}

/**
 * Gate check: validate ticket by number / QR / barcode.
 * Aligned with web `TicketValidationRequest` / `TicketValidationRequestSchema`
 * (at least one identifier enforced by `AtLeastOneTicketIdentifierPipe` + service).
 */
export class ValidateTicketRequest {
  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  barcode?: string;
}

/**
 * Mark ticket as verified at gate.
 * Aligned with web `TicketVerificationRequest` / `TicketVerificationRequestSchema`
 * (`ticketId` must be UUID).
 */
export class VerifyTicketRequest {
  @IsUUID()
  ticketId: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;
}

export class TicketResponse {
  id: string;
  applicationId: string;
  ticketNo: string;
  ticketNumber: string;
  status: string;
  candidateName: string;
  candidateIdNumber: string;
  examTitle: string;
  positionTitle: string;
  examStartTime: Date;
  examEndTime: Date;
  venueName?: string;
  roomNumber?: string;
  seatNumber?: string;
  qrCode?: string;
  issuedAt: Date;
}

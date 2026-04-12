import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ValidateTicketRequest } from '../dto/ticket.dto';

/**
 * Aligns with web `TicketValidationRequestSchema` refine:
 * at least one of ticketNumber / qrCode / barcode must be non-empty.
 */
@Injectable()
export class AtLeastOneTicketIdentifierPipe implements PipeTransform<
  ValidateTicketRequest,
  ValidateTicketRequest
> {
  transform(value: ValidateTicketRequest): ValidateTicketRequest {
    const t = value?.ticketNumber?.trim();
    const q = value?.qrCode?.trim();
    const b = value?.barcode?.trim();
    if (!t && !q && !b) {
      throw new BadRequestException(
        '必须提供 ticketNumber、qrCode 或 barcode 之一',
      );
    }
    return value;
  }
}

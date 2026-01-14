import { TicketService } from './ticket.service';
import { ApiResult } from '../common/dto/api-result.dto';
export declare class TicketController {
    private readonly ticketService;
    constructor(ticketService: TicketService);
    getByApplication(applicationId: string): Promise<ApiResult<import("./dto/ticket.dto").TicketResponse[]>>;
}

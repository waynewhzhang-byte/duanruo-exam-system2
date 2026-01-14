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

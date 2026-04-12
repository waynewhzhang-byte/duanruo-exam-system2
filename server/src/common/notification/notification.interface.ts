export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export interface NotificationPayload {
  to: string;
  subject?: string;
  template?: string;
  data: Record<string, unknown>;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<boolean>;
  getChannel(): NotificationChannel;
}

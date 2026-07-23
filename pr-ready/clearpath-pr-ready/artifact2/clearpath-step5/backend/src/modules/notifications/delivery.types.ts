export type DeliveryChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type DeliveryJob = { notificationId: string; userId: string; channel: DeliveryChannel; recipient: string; subject?: string; body: string; attempts: number };

/** Provider boundary. Implement SES/SMTP, Twilio and FCM adapters behind this interface. */
export interface NotificationProvider { send(job: DeliveryJob): Promise<void>; }

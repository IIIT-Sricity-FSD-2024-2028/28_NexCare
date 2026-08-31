import { UserRole } from '../../common/interfaces/api-response.interface';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ALERT = 'ALERT',
  ACTION_REQUIRED = 'ACTION_REQUIRED'
}

export enum NotificationEntityType {
  STAFF = 'STAFF',
  LEAVE = 'LEAVE',
  INVENTORY = 'INVENTORY',
  APPOINTMENT = 'APPOINTMENT',
  REFERRAL = 'REFERRAL',
  AMBULANCE = 'AMBULANCE',
  HOSPITAL = 'HOSPITAL',
  BILLING = 'BILLING',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

export interface Notification {
  id: string;
  recipientUserId?: string;
  recipientRole?: UserRole | string;
  hospitalId?: string;
  regionId?: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType | string;
  entityId?: string;
  actionUrl?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export interface CreateNotificationDto {
  recipientUserId?: string;
  recipientRole?: UserRole | string;
  hospitalId?: string;
  regionId?: string;
  type?: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType | string;
  entityId?: string;
  actionUrl?: string;
}

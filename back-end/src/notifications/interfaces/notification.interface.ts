import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: 'ID of the specific user to notify' })
  recipientUserId?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Role of users to notify (e.g. all doctors)' })
  recipientRole?: UserRole | string;

  @ApiPropertyOptional({ description: 'Notify users in a specific hospital' })
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'Notify users in a specific region' })
  regionId?: string;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Type/Severity of the notification' })
  type?: NotificationType;

  @ApiProperty({ description: 'Short title for the notification', example: 'New Shift Assigned' })
  title: string;

  @ApiProperty({ description: 'Full message body', example: 'You have been assigned a new shift starting tomorrow.' })
  message: string;

  @ApiPropertyOptional({ enum: NotificationEntityType, description: 'Type of entity this relates to' })
  entityType?: NotificationEntityType | string;

  @ApiPropertyOptional({ description: 'ID of the related entity' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'URL to navigate to when clicked' })
  actionUrl?: string;
}

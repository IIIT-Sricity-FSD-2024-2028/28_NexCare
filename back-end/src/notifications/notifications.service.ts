import { Injectable } from '@nestjs/common';
import { FileStore } from '../common/utils/file-store.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ResponseUtil } from '../common/utils/response.util';
import { UserRole } from '../common/interfaces/api-response.interface';
import {
  Notification,
  CreateNotificationDto,
  NotificationType,
  NotificationEntityType,
} from './interfaces/notification.interface';

@Injectable()
export class NotificationsService {
  private readonly store = new FileStore<Notification>('notifications.json', () =>
    NotificationsService.seedNotifications(),
  );

  private static seedNotifications(): Notification[] {
    return [
      {
        id: 'NOTIF-001',
        recipientRole: UserRole.HOSPITAL_MANAGER,
        hospitalId: 'H001',
        type: NotificationType.ACTION_REQUIRED,
        title: 'New Leave Request',
        message: 'Dr. Sunita Sharma submitted a Conference Leave request (05 Sep - 08 Sep).',
        entityType: NotificationEntityType.LEAVE,
        entityId: 'L002',
        createdAt: '2026-08-28T11:00:00Z',
        read: false,
      },
      {
        id: 'NOTIF-002',
        recipientRole: UserRole.HOSPITAL_MANAGER,
        hospitalId: 'H001',
        type: NotificationType.ACTION_REQUIRED,
        title: 'Inventory Purchase Requirement',
        message: 'New inventory purchase request submitted by Front Desk operations.',
        entityType: NotificationEntityType.INVENTORY,
        entityId: 'REQ-001',
        createdAt: '2026-08-29T09:30:00Z',
        read: false,
      },
      {
        id: 'NOTIF-003',
        recipientRole: UserRole.ADMINISTRATIVE_STAFF,
        hospitalId: 'H001',
        type: NotificationType.SUCCESS,
        title: 'Inventory Purchase Approved',
        message: 'Hospital Manager approved requirement for Surgical Gloves & Syringes.',
        entityType: NotificationEntityType.INVENTORY,
        entityId: 'REQ-001',
        createdAt: '2026-08-29T14:00:00Z',
        read: false,
      },
      {
        id: 'NOTIF-004',
        recipientRole: UserRole.SUPERUSER,
        type: NotificationType.INFO,
        title: 'Hospital Registration Submitted',
        message: 'Apollo Health City submitted hospital verification details.',
        entityType: NotificationEntityType.HOSPITAL,
        entityId: 'H002',
        createdAt: '2026-08-27T08:00:00Z',
        read: false,
      },
      {
        id: 'NOTIF-005',
        recipientRole: UserRole.DOCTOR,
        recipientUserId: 'U005',
        hospitalId: 'H001',
        type: NotificationType.SUCCESS,
        title: 'Leave Request Approved',
        message: 'Your Conference Leave request (05 Sep - 08 Sep) has been approved by Hospital Manager.',
        entityType: NotificationEntityType.LEAVE,
        entityId: 'L002',
        createdAt: '2026-08-30T10:33:36Z',
        read: true,
        readAt: '2026-08-30T10:45:00Z',
      },
    ];
  }

  create(dto: CreateNotificationDto): Notification {
    const notifications = this.store.load();
    const newNotif: Notification = {
      id: IdGenerator.generate('NOTIF'),
      recipientUserId: dto.recipientUserId,
      recipientRole: dto.recipientRole,
      hospitalId: dto.hospitalId,
      regionId: dto.regionId,
      type: dto.type || NotificationType.INFO,
      title: dto.title,
      message: dto.message,
      entityType: dto.entityType,
      entityId: dto.entityId,
      actionUrl: dto.actionUrl,
      createdAt: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotif);
    this.store.save(notifications);
    return newNotif;
  }

  findAll(user: any) {
    const notifications = this.store.load();
    const scoped = notifications.filter(n => this.isRecipient(n, user));
    scoped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ResponseUtil.success('Notifications retrieved successfully', scoped);
  }

  getUnreadCount(user: any) {
    const notifications = this.store.load();
    const count = notifications.filter(n => this.isRecipient(n, user) && !n.read).length;
    return ResponseUtil.success('Unread count retrieved', { unreadCount: count });
  }

  markAsRead(id: string, user: any) {
    const notifications = this.store.load();
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return ResponseUtil.error('Notification not found', 404);

    const n = notifications[index];
    if (!this.isRecipient(n, user)) {
      return ResponseUtil.error('Access denied to this notification', 403);
    }

    notifications[index] = {
      ...n,
      read: true,
      readAt: new Date().toISOString(),
    };
    this.store.save(notifications);
    return ResponseUtil.success('Notification marked as read', notifications[index]);
  }

  markAllAsRead(user: any) {
    const notifications = this.store.load();
    let updatedCount = 0;
    const now = new Date().toISOString();

    const updated = notifications.map(n => {
      if (this.isRecipient(n, user) && !n.read) {
        updatedCount++;
        return { ...n, read: true, readAt: now };
      }
      return n;
    });

    this.store.save(updated);
    return ResponseUtil.success(`Marked ${updatedCount} notifications as read`, { updatedCount });
  }

  private isRecipient(n: Notification, user: any): boolean {
    if (!user) return false;

    // Superuser sees all system/superuser notifications or anything platform-level
    if (user.role === UserRole.SUPERUSER || user.role === 'superuser') {
      return true;
    }

    // Direct recipient user ID match
    if (n.recipientUserId && (n.recipientUserId === user.id || n.recipientUserId === user.sub)) {
      return true;
    }

    // Regional Officer scope match
    if (user.role === UserRole.REGIONAL_MANAGER || user.role === 'regional_officer' || user.role === 'regional_manager') {
      if (n.recipientRole === UserRole.REGIONAL_MANAGER || n.recipientRole === 'regional_officer' || n.recipientRole === 'regional_manager') {
        if (!n.regionId || n.regionId === user.regionId) return true;
      }
    }

    // Hospital-scoped role match (Hospital Manager, Admin Staff, Doctor, Ambulance)
    const userRoleNorm = this.normalizeRole(user.role);
    const notifRoleNorm = this.normalizeRole(n.recipientRole);

    if (notifRoleNorm && userRoleNorm === notifRoleNorm) {
      if (!n.hospitalId || !user.hospitalId || n.hospitalId === user.hospitalId) {
        return true;
      }
    }

    return false;
  }

  private normalizeRole(role?: string): string {
    if (!role) return '';
    const r = role.toLowerCase().trim();
    if (r === 'regional_manager' || r === 'regional_officer') return 'regional_officer';
    if (r === 'hospital_manager' || r === 'hospital_admin') return 'hospital_manager';
    if (r === 'administrative_staff' || r === 'admin_staff') return 'administrative_staff';
    if (r === 'ambulance' || r === 'ambulance_staff') return 'ambulance';
    if (r === 'doctor') return 'doctor';
    if (r === 'patient') return 'patient';
    if (r === 'superuser' || r === 'super_user') return 'superuser';
    return r;
  }
}

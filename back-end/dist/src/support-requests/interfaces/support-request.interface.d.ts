export declare enum SupportRequestStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    WAITING_FOR_HOSPITAL = "waiting_for_hospital",
    WAITING_FOR_MANAGER = "waiting_for_manager",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare enum SupportRequestPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export interface SupportRequest {
    id: string;
    hospitalId: string;
    createdBy: string;
    assignedManagerId?: string;
    category: string;
    subject: string;
    description: string;
    priority: SupportRequestPriority;
    status: SupportRequestStatus;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}
export interface CreateSupportRequestDto {
    hospitalId: string;
    category: string;
    subject: string;
    description: string;
    priority: SupportRequestPriority;
}
export interface UpdateSupportRequestDto {
    status?: SupportRequestStatus;
    assignedManagerId?: string;
    priority?: SupportRequestPriority;
    resolvedAt?: string;
}

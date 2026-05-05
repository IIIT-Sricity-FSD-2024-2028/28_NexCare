export interface SystemActivity {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    details: string;
    module: string;
    severity: string;
    createdAt?: string;
}
export interface SystemSettings {
    id: string;
    key: string;
    value: string;
    description: string;
    category: string;
    updatedAt?: string;
}
export interface CreateSystemActivityRequest {
    userId: string;
    action: string;
    details: string;
    module: string;
    severity: string;
}
export interface UpdateSystemSettingsRequest {
    value: string;
    description?: string;
}
export interface SystemStats {
    totalActivities: number;
    activitiesToday: number;
    activitiesByModule: Record<string, number>;
    activitiesBySeverity: Record<string, number>;
    totalSettings: number;
    settingsByCategory: Record<string, number>;
    systemUptime: number;
    lastActivity?: string;
}

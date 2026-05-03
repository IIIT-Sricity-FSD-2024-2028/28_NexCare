/**
 * System Activity Entity Interface
 * Represents system activity logs in the NexCare system
 */
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

/**
 * System Settings Entity Interface
 * Represents system configuration settings
 */
export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt?: string;
}

/**
 * Create System Activity Request Interface
 */
export interface CreateSystemActivityRequest {
  userId: string;
  action: string;
  details: string;
  module: string;
  severity: string;
}

/**
 * Update System Settings Request Interface
 */
export interface UpdateSystemSettingsRequest {
  value: string;
  description?: string;
}

/**
 * System Statistics Interface
 */
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

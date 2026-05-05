import { CreateSystemActivityRequest, UpdateSystemSettingsRequest } from './interfaces/system.interface';
export declare class SystemService {
    private systemActivity;
    private systemSettings;
    findAllActivity(userId?: string, module?: string, severity?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findActivityById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    createActivity(activityData: CreateSystemActivityRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findAllSettings(category?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findSettingById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findSettingByKey(key: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateSetting(id: string, updateData: UpdateSystemSettingsRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActivitiesByDateRange(startDate: string, endDate: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActivitiesByUser(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRecentActivities(limit?: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getSettingsByCategory(category: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    searchActivities(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}

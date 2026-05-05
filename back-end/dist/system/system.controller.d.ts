import { SystemService } from './system.service';
import { CreateSystemActivityDto } from './dto/create-activity.dto';
import { UpdateSystemSettingsDto } from './dto/update-settings.dto';
export declare class SystemController {
    private readonly systemService;
    constructor(systemService: SystemService);
    findAllActivity(userId?: string, module?: string, severity?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    createActivity(createActivityDto: CreateSystemActivityDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findAllSettings(category?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findSettingByKey(key: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActivitiesByDateRange(startDate: string, endDate: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActivitiesByUser(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRecentActivities(limit?: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getSettingsByCategory(category: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    searchActivities(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findActivityById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findSettingById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateSetting(id: string, updateSettingsDto: UpdateSystemSettingsDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}

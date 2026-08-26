import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    private isPatient;
    findAll(req: any, patientId?: string, status?: string, category?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(req: any, createFeedbackDto: CreateFeedbackDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(req: any, patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByCategory(category: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByRating(rating: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getUnresolvedFeedback(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getHighPriorityFeedback(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}

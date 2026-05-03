import { CreateFeedbackRequest, UpdateFeedbackRequest } from './interfaces/feedback.interface';
import { FeedbackStatus } from '../common/interfaces/api-response.interface';
export declare class FeedbackService {
    private feedback;
    findAll(patientId?: string, status?: FeedbackStatus, category?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(feedbackData: CreateFeedbackRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateFeedbackRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByCategory(category: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByRating(rating: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: FeedbackStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getUnresolvedFeedback(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getHighPriorityFeedback(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}

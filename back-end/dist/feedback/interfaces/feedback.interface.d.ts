import { FeedbackStatus } from '../../common/interfaces/api-response.interface';
export interface Feedback {
    id: string;
    patientId: string;
    sender: string;
    type: string;
    category: string;
    subject: string;
    summary: string;
    rating: number;
    status: FeedbackStatus;
    createdAt: string;
    updatedAt?: string;
}
export interface CreateFeedbackRequest {
    patientId: string;
    type: string;
    category: string;
    subject: string;
    summary: string;
    rating: number;
}
export interface UpdateFeedbackRequest {
    category?: string;
    subject?: string;
    summary?: string;
    rating?: number;
    status?: FeedbackStatus;
}
export interface FeedbackStats {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    averageRating: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    byRating: Record<number, number>;
}

import { FeedbackStatus } from '../../common/interfaces/api-response.interface';
export declare class UpdateFeedbackDto {
    category?: string;
    subject?: string;
    summary?: string;
    rating?: number;
    status?: FeedbackStatus;
}

import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { Feedback, CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackStats } from './interfaces/feedback.interface';
import { FeedbackStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';

/**
 * Feedback Service
 * Manages communication and feedback system in the NexCare system
 * Handles CRUD operations for feedback with status tracking
 */
@Injectable()
export class FeedbackService {
  constructor(private readonly systemService: SystemService) {}

  // In-memory mock feedback database (aligned with frontend db.js)
  private feedback: Feedback[] = [
    {
      id: 'FB-001',
      patientId: 'P001',
      sender: 'John Anderson',
      type: 'Patient',
      category: 'service',
      subject: 'Great doctors',
      summary: 'Dr. Smith was incredibly thorough and attentive.',
      rating: 5,
      status: FeedbackStatus.RESOLVED,
      createdAt: '2026-03-15T10:00:00Z'
    },
    {
      id: 'FB-002',
      patientId: 'P002',
      sender: 'Maria Garcia',
      type: 'Patient',
      category: 'facilities',
      subject: 'Wait times in ER',
      summary: 'Waiting room was cold and wait was an hour.',
      rating: 2,
      status: FeedbackStatus.OPEN,
      createdAt: '2026-04-02T14:30:00Z'
    },
    {
      id: 'FB-003',
      patientId: 'U005',
      sender: 'Dr. Sarah Smith',
      type: 'Staff',
      category: 'software',
      subject: 'System crash',
      summary: 'EHR system frequently times out on large files.',
      rating: 3,
      status: FeedbackStatus.IN_PROGRESS,
      createdAt: '2026-04-01T09:15:00Z'
    }
  ];

  /**
   * Get all feedback with optional filtering
   * @param patientId Optional patient filter
   * @param status Optional status filter
   * @param category Optional category filter
   * @returns List of feedback
   */
  async findAll(patientId?: string, status?: FeedbackStatus, category?: string) {
    try {
      let filteredFeedback = [...this.feedback];

      // Apply patient filter
      if (patientId) {
        filteredFeedback = filteredFeedback.filter(f => f.patientId === patientId);
      }

      // Apply status filter
      if (status) {
        filteredFeedback = filteredFeedback.filter(f => f.status === status);
      }

      // Apply category filter
      if (category) {
        filteredFeedback = filteredFeedback.filter(f => f.category === category);
      }

      return ResponseUtil.success('Feedback retrieved successfully', filteredFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve feedback');
    }
  }

  /**
   * Get feedback by ID
   * @param id Feedback ID
   * @returns Feedback data
   */
  async findById(id: string) {
    try {
      const feedbackItem = this.feedback.find(f => f.id === id);
      
      if (!feedbackItem) {
        return ResponseUtil.notFound('Feedback', id);
      }

      return ResponseUtil.success('Feedback retrieved successfully', feedbackItem);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve feedback');
    }
  }

  /**
   * Create new feedback
   * @param feedbackData Feedback creation data
   * @returns Created feedback data
   */
  async create(feedbackData: CreateFeedbackRequest) {
    try {
      // Validate rating
      if (feedbackData.rating < 1 || feedbackData.rating > 5) {
        return ResponseUtil.error('Rating must be between 1 and 5');
      }

      // Generate new feedback ID
      const newFeedbackId = IdGenerator.generateFeedbackId();

      // Create new feedback
      const newFeedback: Feedback = {
        id: newFeedbackId,
        patientId: feedbackData.patientId,
        sender: `User ${feedbackData.patientId}`, // Would fetch from user service
        type: feedbackData.type,
        category: feedbackData.category,
        subject: feedbackData.subject,
        summary: feedbackData.summary,
        rating: feedbackData.rating,
        status: FeedbackStatus.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to feedback array
      this.feedback.push(newFeedback);

      // Log activity
      this.systemService.createActivity({
        userId: feedbackData.patientId,
        action: 'Submit',
        details: `${newFeedback.type} feedback ${newFeedbackId} submitted: ${newFeedback.subject}`,
        module: 'Feedback',
        severity: newFeedback.rating <= 2 ? 'WARNING' : 'INFO'
      });

      return ResponseUtil.created('Feedback created successfully', newFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create feedback');
    }
  }

  /**
   * Update feedback
   * @param id Feedback ID
   * @param updateData Feedback update data
   * @returns Updated feedback data
   */
  async update(id: string, updateData: UpdateFeedbackRequest) {
    try {
      const feedbackIndex = this.feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        return ResponseUtil.notFound('Feedback', id);
      }

      // Validate rating if provided
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        return ResponseUtil.error('Rating must be between 1 and 5');
      }

      // Update feedback
      const updatedFeedback = {
        ...this.feedback[feedbackIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.feedback[feedbackIndex] = updatedFeedback;

      // Log activity
      this.systemService.createActivity({
        userId: 'System',
        action: 'Update',
        details: `Feedback ${id} updated`,
        module: 'Feedback',
        severity: 'INFO'
      });

      return ResponseUtil.updated('Feedback updated successfully', updatedFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update feedback');
    }
  }

  /**
   * Delete feedback
   * @param id Feedback ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const feedbackIndex = this.feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        return ResponseUtil.notFound('Feedback', id);
      }

      // Remove feedback
      this.feedback.splice(feedbackIndex, 1);

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Delete',
        details: `Feedback ${id} deleted`,
        module: 'Feedback',
        severity: 'WARNING'
      });

      return ResponseUtil.deleted('Feedback');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete feedback');
    }
  }

  /**
   * Get feedback statistics
   * @returns Feedback statistics
   */
  async getStats() {
    try {
      const totalFeedback = this.feedback.length;
      const openFeedback = this.feedback.filter(f => f.status === FeedbackStatus.OPEN).length;
      const inProgressFeedback = this.feedback.filter(f => f.status === FeedbackStatus.IN_PROGRESS).length;
      const resolvedFeedback = this.feedback.filter(f => f.status === FeedbackStatus.RESOLVED).length;

      // Average rating
      const totalRating = this.feedback.reduce((sum, f) => sum + f.rating, 0);
      const averageRating = totalFeedback > 0 ? Math.round((totalRating / totalFeedback) * 10) / 10 : 0;

      // By category
      const byCategory: Record<string, number> = {};
      this.feedback.forEach(f => {
        byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      });

      // By type
      const byType: Record<string, number> = {};
      this.feedback.forEach(f => {
        byType[f.type] = (byType[f.type] || 0) + 1;
      });

      // By rating
      const byRating: Record<number, number> = {};
      this.feedback.forEach(f => {
        byRating[f.rating] = (byRating[f.rating] || 0) + 1;
      });

      const stats: FeedbackStats = {
        total: totalFeedback,
        open: openFeedback,
        inProgress: inProgressFeedback,
        resolved: resolvedFeedback,
        averageRating,
        byCategory,
        byType,
        byRating
      };

      return ResponseUtil.success('Feedback statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve feedback statistics');
    }
  }

  /**
   * Get feedback by patient
   * @param patientId Patient ID
   * @returns Patient feedback
   */
  async findByPatient(patientId: string) {
    try {
      const feedbackItems = this.feedback.filter(f => f.patientId === patientId);
      
      return ResponseUtil.success(`Feedback for patient ${patientId} retrieved successfully`, feedbackItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient feedback');
    }
  }

  /**
   * Get feedback by category
   * @param category Category name
   * @returns Category feedback
   */
  async findByCategory(category: string) {
    try {
      const feedbackItems = this.feedback.filter(f => f.category === category);
      
      return ResponseUtil.success(`Feedback in category '${category}' retrieved successfully`, feedbackItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve category feedback');
    }
  }

  /**
   * Get feedback by rating
   * @param rating Rating value
   * @returns Rating feedback
   */
  async findByRating(rating: number) {
    try {
      if (rating < 1 || rating > 5) {
        return ResponseUtil.error('Rating must be between 1 and 5');
      }

      const feedbackItems = this.feedback.filter(f => f.rating === rating);
      
      return ResponseUtil.success(`Feedback with rating ${rating} retrieved successfully`, feedbackItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve rating feedback');
    }
  }

  /**
   * Update feedback status
   * @param id Feedback ID
   * @param status New status
   * @returns Updated feedback data
   */
  async updateStatus(id: string, status: FeedbackStatus) {
    try {
      const feedbackIndex = this.feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        return ResponseUtil.notFound('Feedback', id);
      }

      // Update status
      this.feedback[feedbackIndex].status = status;
      this.feedback[feedbackIndex].updatedAt = new Date().toISOString();

      const updatedFeedback = this.feedback[feedbackIndex];

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Resolve',
        details: `Feedback ${id} status updated to ${status}`,
        module: 'Feedback',
        severity: status === FeedbackStatus.RESOLVED ? 'SUCCESS' : 'INFO'
      });

      return ResponseUtil.updated('Feedback status updated successfully', updatedFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update feedback status');
    }
  }

  /**
   * Get unresolved feedback
   * @returns Unresolved feedback
   */
  async getUnresolvedFeedback() {
    try {
      const unresolvedFeedback = this.feedback.filter(f => f.status !== FeedbackStatus.RESOLVED);
      
      return ResponseUtil.success('Unresolved feedback retrieved successfully', unresolvedFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve unresolved feedback');
    }
  }

  /**
   * Get high priority feedback (low ratings)
   * @returns High priority feedback
   */
  async getHighPriorityFeedback() {
    try {
      const highPriorityFeedback = this.feedback.filter(f => f.rating <= 2 && f.status !== FeedbackStatus.RESOLVED);
      
      return ResponseUtil.success('High priority feedback retrieved successfully', highPriorityFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve high priority feedback');
    }
  }
}

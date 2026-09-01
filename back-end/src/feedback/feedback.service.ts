import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { Feedback, CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackStats } from './interfaces/feedback.interface';
import { FeedbackStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';

/**
 * Feedback Service
 * Manages communication and feedback system in the NexCare system
 * Handles CRUD operations for feedback with status tracking
 * Uses file-based persistence (data/feedback.json)
 */
@Injectable()
export class FeedbackService {
  constructor(private readonly systemService: SystemService) {}

  // File persistence path
  private readonly feedbackFilePath = path.join(process.cwd(), 'data', 'feedback.json');

  // Initial seed data (written to file on first access)
  private readonly seedData: Feedback[] = [
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

  /** Load feedback from disk (seeds the file if it doesn't exist) */
  private loadFeedback(): Feedback[] {
    try {
      const raw = fs.readFileSync(this.feedbackFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      // File doesn't exist — seed it
      this.saveFeedback(this.seedData);
      return [...this.seedData];
    }
  }

  /** Persist the full feedback array to disk */
  private saveFeedback(feedback: Feedback[]): void {
    try {
      fs.mkdirSync(path.dirname(this.feedbackFilePath), { recursive: true });
      fs.writeFileSync(this.feedbackFilePath, JSON.stringify(feedback, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist feedback to disk:', err);
    }
  }

  /**
   * Get all feedback with optional filtering
   */
  async findAll(patientId?: string, status?: FeedbackStatus, category?: string, hospitalId?: string) {
    try {
      let filteredFeedback = [...this.loadFeedback()];

      if (patientId) {
        filteredFeedback = filteredFeedback.filter(f => f.patientId === patientId);
      }
      
      if (hospitalId) {
        filteredFeedback = filteredFeedback.filter(f => f.hospitalId === hospitalId);
      }

      if (status) {
        filteredFeedback = filteredFeedback.filter(f => f.status === status);
      }
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
   */
  async findById(id: string) {
    try {
      const feedbackItem = this.loadFeedback().find(f => f.id === id);
      
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
   */
  async create(feedbackData: CreateFeedbackRequest) {
    try {
      if (feedbackData.rating < 1 || feedbackData.rating > 5) {
        return ResponseUtil.error('Rating must be between 1 and 5');
      }

      const feedback = this.loadFeedback();
      const newFeedbackId = IdGenerator.generateFeedbackId();

      const newFeedback: Feedback = {
        id: newFeedbackId,
        patientId: feedbackData.patientId,
        sender: feedbackData.sender || `User ${feedbackData.patientId}`,
        type: feedbackData.type,
        category: feedbackData.category,
        subject: feedbackData.subject,
        summary: feedbackData.summary,
        rating: feedbackData.rating,
        status: FeedbackStatus.OPEN,
        hospitalId: feedbackData.hospitalId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      feedback.push(newFeedback);
      this.saveFeedback(feedback);

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
   */
  async update(id: string, updateData: UpdateFeedbackRequest) {
    try {
      const feedback = this.loadFeedback();
      const feedbackIndex = feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        return ResponseUtil.notFound('Feedback', id);
      }

      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        return ResponseUtil.error('Rating must be between 1 and 5');
      }

      const updatedFeedback = {
        ...feedback[feedbackIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      feedback[feedbackIndex] = updatedFeedback;
      this.saveFeedback(feedback);

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
   */
  async delete(id: string) {
    try {
      const feedback = this.loadFeedback();
      const feedbackIndex = feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        return ResponseUtil.notFound('Feedback', id);
      }

      feedback.splice(feedbackIndex, 1);
      this.saveFeedback(feedback);

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
   */
  async getStats() {
    try {
      const feedback = this.loadFeedback();
      const totalFeedback = feedback.length;
      const openFeedback = feedback.filter(f => f.status === FeedbackStatus.OPEN).length;
      const inProgressFeedback = feedback.filter(f => f.status === FeedbackStatus.IN_PROGRESS).length;
      const resolvedFeedback = feedback.filter(f => f.status === FeedbackStatus.RESOLVED).length;

      const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
      const averageRating = totalFeedback > 0 ? Math.round((totalRating / totalFeedback) * 10) / 10 : 0;

      const byCategory: Record<string, number> = {};
      feedback.forEach(f => {
        byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      });

      const byType: Record<string, number> = {};
      feedback.forEach(f => {
        byType[f.type] = (byType[f.type] || 0) + 1;
      });

      const byRating: Record<number, number> = {};
      feedback.forEach(f => {
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
   */
  async findByPatient(patientId: string) {
    try {
      const feedbackItems = this.loadFeedback().filter(f => f.patientId === patientId);
      return ResponseUtil.success(`Feedback for patient ${patientId} retrieved successfully`, feedbackItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient feedback');
    }
  }

  /**
   * Get feedback by category
   */
  async findByCategory(category: string) {
    try {
      const feedbackItems = this.loadFeedback().filter(f => f.category === category);
      return ResponseUtil.success(`Feedback in category '${category}' retrieved successfully`, feedbackItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve category feedback');
    }
  }

  /**
   * Get feedback by rating
   */
  async findByRating(rating: number) {
    try {
      if (rating < 1 || rating > 5) {
        return ResponseUtil.error('Rating must be between 1 and 5');
      }
      const feedbackItems = this.loadFeedback().filter(f => f.rating === rating);
      return ResponseUtil.success(`Feedback with rating ${rating} retrieved successfully`, feedbackItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve rating feedback');
    }
  }

  /**
   * Update feedback status
   */
  async updateStatus(id: string, status: FeedbackStatus) {
    try {
      const feedback = this.loadFeedback();
      const feedbackIndex = feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        return ResponseUtil.notFound('Feedback', id);
      }

      feedback[feedbackIndex].status = status;
      feedback[feedbackIndex].updatedAt = new Date().toISOString();
      const updatedFeedback = feedback[feedbackIndex];
      this.saveFeedback(feedback);

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
   */
  async getUnresolvedFeedback() {
    try {
      const unresolvedFeedback = this.loadFeedback().filter(f => f.status !== FeedbackStatus.RESOLVED);
      return ResponseUtil.success('Unresolved feedback retrieved successfully', unresolvedFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve unresolved feedback');
    }
  }

  /**
   * Get high priority feedback (low ratings)
   */
  async getHighPriorityFeedback() {
    try {
      const highPriorityFeedback = this.loadFeedback().filter(f => f.rating <= 2 && f.status !== FeedbackStatus.RESOLVED);
      return ResponseUtil.success('High priority feedback retrieved successfully', highPriorityFeedback);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve high priority feedback');
    }
  }

  /**
   * Feedback scoped to hospitals overseen by a regional manager.
   */
  async findForRegionalManager(
    hospitalIds: string[],
    status?: FeedbackStatus,
    category?: string,
    hospitalId?: string,
  ) {
    try {
      const allowed = new Set(hospitalIds);
      let items = this.loadFeedback().filter(f => f.hospitalId && allowed.has(f.hospitalId));

      if (hospitalId && allowed.has(hospitalId)) {
        items = items.filter(f => f.hospitalId === hospitalId);
      }
      if (status) {
        items = items.filter(f => f.status === status);
      }
      if (category) {
        items = items.filter(f => f.category === category);
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const open = items.filter(f => f.status === FeedbackStatus.OPEN).length;
      const inProgress = items.filter(f => f.status === FeedbackStatus.IN_PROGRESS).length;
      const resolved = items.filter(f => f.status === FeedbackStatus.RESOLVED).length;
      const patientItems = items.filter(f => f.type === 'Patient');
      const avgRating = patientItems.length > 0
        ? Math.round((patientItems.reduce((s, f) => s + f.rating, 0) / patientItems.length) * 10) / 10
        : 0;

      return ResponseUtil.success('Regional feedback retrieved successfully', {
        items,
        stats: {
          total: items.length,
          open,
          inProgress,
          resolved,
          averageRating: avgRating,
          lowRating: items.filter(f => f.rating <= 2 && f.status !== FeedbackStatus.RESOLVED).length,
        },
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve regional feedback');
    }
  }
}

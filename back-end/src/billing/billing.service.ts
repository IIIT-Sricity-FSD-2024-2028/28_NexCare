import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { Bill, CreateBillRequest, UpdateBillRequest, PaymentRequest, BillStats, BillItem, Payment } from './interfaces/bill.interface';
import { BillStatus } from '../common/interfaces/api-response.interface';

/**
 * Billing Service
 * Manages financial operations and bill generation in the NexCare system
 * Handles CRUD operations for bills with GST calculations and payment processing
 */
@Injectable()
export class BillingService {
  // In-memory mock bills database (aligned with frontend db.js)
  private bills: Bill[] = [
    {
      id: 'BILL-001',
      patientId: 'P001',
      visitDate: '1 March, 2026',
      dueDate: '15 March, 2026',
      status: BillStatus.PAID,
      currency: '₹',
      subtotal: 1000,
      cgstRate: 0.09,
      sgstRate: 0.09,
      cgstAmount: 90,
      sgstAmount: 90,
      total: 1180,
      items: [
        { description: 'General Consultation', department: 'General Medicine', amount: 1000 }
      ],
      payments: [
        { id: 'PAY-001', amount: 1180, method: 'CARD', createdAt: '2026-03-10T10:00:00Z' }
      ],
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'BILL-002',
      patientId: 'P002',
      visitDate: '2 April, 2026',
      dueDate: '16 April, 2026',
      status: BillStatus.PENDING,
      currency: '₹',
      subtotal: 5500,
      cgstRate: 0.09,
      sgstRate: 0.09,
      cgstAmount: 495,
      sgstAmount: 495,
      total: 6490,
      items: [
        { description: 'Emergency Room Admittance', department: 'ER', amount: 2500 },
        { description: 'MRI Scan', department: 'Radiology', amount: 3000 }
      ],
      payments: [],
      createdAt: '2026-04-02T00:00:00Z'
    }
  ];

  /**
   * Get all bills with optional filtering
   * @param patientId Optional patient filter
   * @param status Optional status filter
   * @returns List of bills
   */
  async findAll(patientId?: string, status?: BillStatus) {
    try {
      let filteredBills = [...this.bills];

      // Apply patient filter
      if (patientId) {
        filteredBills = filteredBills.filter(bill => bill.patientId === patientId);
      }

      // Apply status filter
      if (status) {
        filteredBills = filteredBills.filter(bill => bill.status === status);
      }

      return ResponseUtil.success('Bills retrieved successfully', filteredBills);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve bills');
    }
  }

  /**
   * Get bill by ID
   * @param id Bill ID
   * @returns Bill data
   */
  async findById(id: string) {
    try {
      const bill = this.bills.find(b => b.id === id);
      
      if (!bill) {
        return ResponseUtil.notFound('Bill', id);
      }

      return ResponseUtil.success('Bill retrieved successfully', bill);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve bill');
    }
  }

  /**
   * Create new bill
   * @param billData Bill creation data
   * @returns Created bill data
   */
  async create(billData: CreateBillRequest) {
    try {
      // Generate new bill ID
      const newBillId = IdGenerator.generateBillId();

      // Calculate totals
      const subtotal = billData.items.reduce((sum, item) => sum + item.amount, 0);
      const cgstRate = 0.09;
      const sgstRate = 0.09;
      const cgstAmount = subtotal * cgstRate;
      const sgstAmount = subtotal * sgstRate;
      const total = subtotal + cgstAmount + sgstAmount;

      // Create new bill
      const newBill: Bill = {
        id: newBillId,
        patientId: billData.patientId,
        visitDate: billData.visitDate,
        dueDate: billData.dueDate,
        status: BillStatus.PENDING,
        currency: '₹',
        subtotal,
        cgstRate,
        sgstRate,
        cgstAmount,
        sgstAmount,
        total,
        items: billData.items,
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to bills array
      this.bills.push(newBill);

      return ResponseUtil.created('Bill created successfully', newBill);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create bill');
    }
  }

  /**
   * Update bill
   * @param id Bill ID
   * @param updateData Bill update data
   * @returns Updated bill data
   */
  async update(id: string, updateData: UpdateBillRequest) {
    try {
      const billIndex = this.bills.findIndex(b => b.id === id);
      
      if (billIndex === -1) {
        return ResponseUtil.notFound('Bill', id);
      }

      const bill = this.bills[billIndex];

      // Prevent modification of paid bills
      if (bill.status === BillStatus.PAID) {
        return ResponseUtil.error('Cannot modify paid bills');
      }

      // Update bill
      let updatedBill = { ...bill, ...updateData, updatedAt: new Date().toISOString() };

      // Recalculate totals if items are updated
      if (updateData.items) {
        const subtotal = updateData.items.reduce((sum, item) => sum + item.amount, 0);
        const cgstAmount = subtotal * updatedBill.cgstRate;
        const sgstAmount = subtotal * updatedBill.sgstRate;
        const total = subtotal + cgstAmount + sgstAmount;

        updatedBill = {
          ...updatedBill,
          subtotal,
          cgstAmount,
          sgstAmount,
          total
        };
      }

      this.bills[billIndex] = updatedBill;

      return ResponseUtil.updated('Bill updated successfully', updatedBill);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update bill');
    }
  }

  /**
   * Delete bill
   * @param id Bill ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const billIndex = this.bills.findIndex(b => b.id === id);
      
      if (billIndex === -1) {
        return ResponseUtil.notFound('Bill', id);
      }

      const bill = this.bills[billIndex];

      // Prevent deletion of paid bills
      if (bill.status === BillStatus.PAID) {
        return ResponseUtil.error('Cannot delete paid bills');
      }

      // Remove bill
      this.bills.splice(billIndex, 1);

      return ResponseUtil.deleted('Bill');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete bill');
    }
  }

  /**
   * Process payment for bill
   * @param id Bill ID
   * @param paymentData Payment data
   * @returns Updated bill data
   */
  async processPayment(id: string, paymentData: PaymentRequest) {
    try {
      const billIndex = this.bills.findIndex(b => b.id === id);
      
      if (billIndex === -1) {
        return ResponseUtil.notFound('Bill', id);
      }

      const bill = this.bills[billIndex];

      // Prevent payment for already paid bills
      if (bill.status === BillStatus.PAID) {
        return ResponseUtil.error('Bill is already paid');
      }

      // Calculate total paid so far
      const totalPaid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingAmount = bill.total - totalPaid;

      // Validate payment amount
      if (paymentData.amount > remainingAmount) {
        return ResponseUtil.error(`Payment amount exceeds remaining balance of ₹${remainingAmount}`);
      }

      // Create new payment
      const newPayment: Payment = {
        id: IdGenerator.generatePaymentId(),
        amount: paymentData.amount,
        method: paymentData.method,
        createdAt: new Date().toISOString()
      };

      // Add payment to bill
      bill.payments.push(newPayment);

      // Update bill status if fully paid
      const newTotalPaid = totalPaid + paymentData.amount;
      if (newTotalPaid >= bill.total) {
        bill.status = BillStatus.PAID;
      }

      bill.updatedAt = new Date().toISOString();

      return ResponseUtil.updated('Payment processed successfully', bill);
    } catch (error) {
      return ResponseUtil.serverError('Failed to process payment');
    }
  }

  /**
   * Get bill statistics
   * @returns Bill statistics
   */
  async getStats() {
    try {
      const totalBills = this.bills.length;
      const pendingBills = this.bills.filter(b => b.status === BillStatus.PENDING).length;
      const paidBills = this.bills.filter(b => b.status === BillStatus.PAID).length;
      const overdueBills = this.bills.filter(b => b.status === BillStatus.OVERDUE).length;
      
      // Revenue calculations
      const totalRevenue = this.bills
        .filter(b => b.status === BillStatus.PAID)
        .reduce((sum, bill) => sum + bill.total, 0);
      
      const pendingRevenue = this.bills
        .filter(b => b.status === BillStatus.PENDING)
        .reduce((sum, bill) => sum + bill.total, 0);

      // Average bill amount
      const averageBillAmount = totalBills > 0 ? Math.round(
        this.bills.reduce((sum, bill) => sum + bill.total, 0) / totalBills
      ) : 0;

      // By department
      const byDepartment: Record<string, number> = {};
      this.bills.forEach(bill => {
        bill.items.forEach(item => {
          byDepartment[item.department] = (byDepartment[item.department] || 0) + item.amount;
        });
      });

      const stats: BillStats = {
        total: totalBills,
        pending: pendingBills,
        paid: paidBills,
        overdue: overdueBills,
        totalRevenue,
        pendingRevenue,
        averageBillAmount,
        byDepartment
      };

      return ResponseUtil.success('Bill statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve bill statistics');
    }
  }

  /**
   * Get bills by patient
   * @param patientId Patient ID
   * @returns Patient bills
   */
  async findByPatient(patientId: string) {
    try {
      const bills = this.bills.filter(b => b.patientId === patientId);
      
      return ResponseUtil.success(`Bills for patient ${patientId} retrieved successfully`, bills);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient bills');
    }
  }

  /**
   * Get overdue bills
   * @returns Overdue bills
   */
  async getOverdueBills() {
    try {
      const today = new Date();
      const overdueBills = this.bills.filter(bill => {
        if (bill.status === BillStatus.PAID) return false;
        const dueDate = new Date(bill.dueDate);
        return dueDate < today;
      });

      return ResponseUtil.success('Overdue bills retrieved successfully', overdueBills);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve overdue bills');
    }
  }

  /**
   * Calculate GST breakdown
   * @param amount Base amount
   * @returns GST breakdown
   */
  private calculateGST(amount: number) {
    const cgstRate = 0.09;
    const sgstRate = 0.09;
    const cgstAmount = amount * cgstRate;
    const sgstAmount = amount * sgstRate;
    const total = amount + cgstAmount + sgstAmount;

    return {
      subtotal: amount,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      total
    };
  }

  /**
   * Get revenue by date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Revenue data
   */
  async getRevenueByDateRange(startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const billsInRange = this.bills.filter(bill => {
        const billDate = new Date(bill.visitDate);
        return billDate >= start && billDate <= end && bill.status === BillStatus.PAID;
      });

      const revenue = billsInRange.reduce((sum, bill) => sum + bill.total, 0);

      return ResponseUtil.success(`Revenue from ${startDate} to ${endDate} retrieved successfully`, {
        revenue,
        billCount: billsInRange.length,
        dateRange: { startDate, endDate }
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve revenue data');
    }
  }
}

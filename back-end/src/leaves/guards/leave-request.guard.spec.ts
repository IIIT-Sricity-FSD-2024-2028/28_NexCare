import { LeaveRequestGuard } from './leave-request.guard';
import { ExecutionContext, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../common/interfaces/api-response.interface';

describe('LeaveRequestGuard', () => {
  let guard: LeaveRequestGuard;
  let mockLeavesService: any;

  beforeEach(() => {
    mockLeavesService = {
      hasOverlappingLeave: jest.fn(),
    };
    guard = new LeaveRequestGuard({} as any, mockLeavesService);
  });

  describe('POST /leaves validation', () => {
    it('should throw ConflictException (409) if doctor has an overlapping approved leave', async () => {
      mockLeavesService.hasOverlappingLeave.mockResolvedValue(true);

      const mockRequest = {
        method: 'POST',
        body: {
          doctorId: 'U007',
          startDate: '2026-08-20',
          endDate: '2026-08-25',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ConflictException);
      expect(mockLeavesService.hasOverlappingLeave).toHaveBeenCalledWith('U007', '2026-08-20', '2026-08-25');
    });

    it('should allow POST request if no overlapping approved leave exists', async () => {
      mockLeavesService.hasOverlappingLeave.mockResolvedValue(false);

      const mockRequest = {
        method: 'POST',
        body: {
          doctorId: 'U007',
          startDate: '2026-09-10',
          endDate: '2026-09-15',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('PATCH /leaves/:id validation', () => {
    it('should throw ForbiddenException (403) if ADMINISTRATIVE_STAFF tries to approve/reject leave', async () => {
      const mockRequest = {
        method: 'PATCH',
        user: { role: UserRole.ADMINISTRATIVE_STAFF, id: 'U002' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should allow PATCH request if user is a HOSPITAL_MANAGER', async () => {
      const mockRequest = {
        method: 'PATCH',
        user: { role: UserRole.HOSPITAL_MANAGER, id: 'M001' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow PATCH request if user is a SUPERUSER', async () => {
      const mockRequest = {
        method: 'PATCH',
        user: { role: UserRole.SUPERUSER, id: 'U001' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});

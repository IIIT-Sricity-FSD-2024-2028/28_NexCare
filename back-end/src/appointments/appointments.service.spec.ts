import { AppointmentsService } from './appointments.service';
import { AppointmentStatus, UserRole } from '../common/interfaces/api-response.interface';

describe('AppointmentsService - patient cross-hospital booking', () => {
  let service: AppointmentsService;
  let saveAppointments: jest.SpyInstance;

  beforeEach(() => {
    const systemService = {
      createActivity: jest.fn(),
    };
    const patientsService = {
      findById: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'P001',
          fullName: 'Raghav Rao',
          hospitalId: 'H001',
        },
      }),
    };
    const leavesService = {
      findAll: jest.fn().mockResolvedValue({ success: true, data: [] }),
    };
    const usersService = {
      findById: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'DOC-KA01-001',
          name: 'Dr. Ananya Hegde',
          role: UserRole.DOCTOR,
          hospitalId: 'H003',
          dept: 'Cardiology',
          status: 'Active',
        },
      }),
      findByRole: jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'DOC-KA01-001',
            name: 'Dr. Ananya Hegde',
            role: UserRole.DOCTOR,
            hospitalId: 'H003',
            dept: 'Cardiology',
            status: 'Active',
          },
        ],
      }),
    };
    const schedulesService = {
      hasPublishedSchedule: jest.fn().mockReturnValue(true),
      isPublishedCoverage: jest.fn().mockReturnValue(true),
    };
    const billingService = {
      addChargeToPendingBill: jest.fn(),
    };

    service = new AppointmentsService(
      systemService as any,
      patientsService as any,
      leavesService as any,
      usersService as any,
      schedulesService as any,
      billingService as any,
    );

    jest.spyOn(service as any, 'loadAppointments').mockReturnValue([]);
    saveAppointments = jest.spyOn(service as any, 'saveAppointments').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should persist an H003 appointment for a patient whose profile belongs to H001', async () => {
    const result: any = await service.create({
      patientId: 'P001',
      hospitalId: 'H003',
      hospitalName: 'Namma Health Multispeciality',
      doctorId: 'DOC-KA01-001',
      doctor: 'Dr. Ananya Hegde',
      department: 'Cardiology',
      dateLabel: 'December 15, 2035',
      timeLabel: '10:00 AM',
      fee: 900,
      reason: 'Cross-hospital consultation',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        patientId: 'P001',
        patientName: 'Raghav Rao',
        hospitalId: 'H003',
        doctorId: 'DOC-KA01-001',
        status: AppointmentStatus.PENDING,
      }),
    );
    expect(saveAppointments).toHaveBeenCalledWith([
      expect.objectContaining({ patientId: 'P001', hospitalId: 'H003' }),
    ]);
  });
});

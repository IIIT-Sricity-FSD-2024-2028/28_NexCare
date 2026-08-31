import { AppointmentsController } from './appointments.controller';
import { UserRole } from '../common/interfaces/api-response.interface';

describe('AppointmentsController - patient cross-hospital access', () => {
  let controller: AppointmentsController;
  let appointmentsService: {
    create: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(() => {
    appointmentsService = {
      create: jest.fn().mockResolvedValue({ success: true }),
      findAll: jest.fn().mockResolvedValue({ success: true, data: [] }),
    };
    controller = new AppointmentsController(appointmentsService as any);
  });

  it('should let a patient book at a hospital other than their home hospital', async () => {
    const patientRequest = {
      user: {
        role: UserRole.PATIENT,
        patientId: 'P001',
        hospitalId: 'H001',
      },
    };
    const booking = {
      patientId: 'P999',
      hospitalId: 'H003',
      hospitalName: 'Namma Health Multispeciality',
      doctorId: 'DOC-KA01-001',
      doctor: 'Dr. Ananya Hegde',
      department: 'Cardiology',
      dateLabel: 'December 15, 2035',
      timeLabel: '10:00 AM',
    };

    await controller.create(patientRequest, booking as any);

    expect(appointmentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'P001',
        hospitalId: 'H003',
        doctorId: 'DOC-KA01-001',
      }),
    );
  });

  it('should still scope appointment history to the signed-in patient', async () => {
    const patientRequest = {
      user: {
        role: UserRole.PATIENT,
        patientId: 'P001',
        hospitalId: 'H001',
      },
    };

    await controller.findAll(patientRequest, 'P999');

    expect(appointmentsService.findAll).toHaveBeenCalledWith('P001', undefined, undefined);
  });
});

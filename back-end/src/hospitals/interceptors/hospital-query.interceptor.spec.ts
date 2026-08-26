import { HospitalQueryInterceptor } from './hospital-query.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('HospitalQueryInterceptor', () => {
  let interceptor: HospitalQueryInterceptor;

  beforeEach(() => {
    interceptor = new HospitalQueryInterceptor();
  });

  it('should trim whitespace and normalize city & speciality to lowercase, and set x-query-timestamp header', (done) => {
    const mockRequest: any = {
      query: {
        speciality: ' Cardiology ',
        city: ' Chennai ',
        pincode: ' 600001 ',
      },
    };

    const mockResponse: any = {
      setHeader: jest.fn(),
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
      expect(mockRequest.query.speciality).toBe('cardiology');
      expect(mockRequest.query.city).toBe('chennai');
      expect(mockRequest.query.pincode).toBe('600001');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-query-timestamp',
        expect.any(String),
      );
      done();
    });
  });

  it('should safely handle missing or non-string query parameters without crashing', (done) => {
    const mockRequest: any = {
      query: {
        speciality: 123,
        city: undefined,
        pincode: null,
      },
    };

    const mockResponse: any = {
      setHeader: jest.fn(),
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-query-timestamp',
        expect.any(String),
      );
      done();
    });
  });
});

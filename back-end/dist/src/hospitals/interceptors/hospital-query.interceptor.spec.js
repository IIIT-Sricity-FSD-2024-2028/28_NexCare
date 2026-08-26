"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hospital_query_interceptor_1 = require("./hospital-query.interceptor");
const rxjs_1 = require("rxjs");
describe('HospitalQueryInterceptor', () => {
    let interceptor;
    beforeEach(() => {
        interceptor = new hospital_query_interceptor_1.HospitalQueryInterceptor();
    });
    it('should trim whitespace and normalize city & speciality to lowercase, and set x-query-timestamp header', (done) => {
        const mockRequest = {
            query: {
                speciality: ' Cardiology ',
                city: ' Chennai ',
                pincode: ' 600001 ',
            },
        };
        const mockResponse = {
            setHeader: jest.fn(),
        };
        const mockExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            }),
        };
        const mockCallHandler = {
            handle: () => (0, rxjs_1.of)({ success: true }),
        };
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
            expect(mockRequest.query.speciality).toBe('cardiology');
            expect(mockRequest.query.city).toBe('chennai');
            expect(mockRequest.query.pincode).toBe('600001');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('x-query-timestamp', expect.any(String));
            done();
        });
    });
    it('should safely handle missing or non-string query parameters without crashing', (done) => {
        const mockRequest = {
            query: {
                speciality: 123,
                city: undefined,
                pincode: null,
            },
        };
        const mockResponse = {
            setHeader: jest.fn(),
        };
        const mockExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            }),
        };
        const mockCallHandler = {
            handle: () => (0, rxjs_1.of)({ success: true }),
        };
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
            expect(mockResponse.setHeader).toHaveBeenCalledWith('x-query-timestamp', expect.any(String));
            done();
        });
    });
});
//# sourceMappingURL=hospital-query.interceptor.spec.js.map
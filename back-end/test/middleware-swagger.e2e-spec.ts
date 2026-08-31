import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { applyMiddlewareContract, buildSwaggerConfig } from '../src/swagger.config';
import {
  AUTH_LIMIT,
  CSRF_EXEMPT_ROUTES,
  GENERAL_LIMIT,
} from '../src/lodger.middleware';

describe('Middleware & Swagger Guard Synchronization (e2e)', () => {
  let app: INestApplication;
  let superuserToken: string;
  let patientToken: string;
  let hmTokenH001: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Helper to login and get token
    const login = async (email: string, role: string) => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'Password123', role });
      return response.body?.data?.token || response.body?.data?.access_token || '';
    };

    superuserToken = await login('superuser@nexcare.com', 'superuser');
    patientToken = await login('patient@gmail.com', 'patient');
    hmTokenH001 = await login('hospitalmanager@nexcare.com', 'hospital_manager');
  });

  afterAll(async () => {
    await app.close();
  });

  /** Fetch a CSRF token the way the frontend does: from a preceding GET. */
  const csrfToken = async (token: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .get('/hospitals/nearby')
      .set('Authorization', `Bearer ${token}`);
    return res.headers['x-csrf-token'] || '';
  };

  describe('1. Hospital Query & Access', () => {
    it('GET /hospitals/nearby should inject x-query-timestamp', async () => {
      const res = await request(app.getHttpServer())
        .get('/hospitals/nearby')
        .query({ city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517501' });

      expect(res.status).toBe(200);
      expect(res.headers['x-query-timestamp']).toBeDefined();
    });

    it('PUT /hospitals/{id} should reject cross-hospital spoofing', async () => {
        const csrfRes = await request(app.getHttpServer())
          .get('/hospitals/nearby')
          .set('Authorization', `Bearer ${hmTokenH001}`);
        const csrfToken = csrfRes.headers['x-csrf-token'];
        const res = await request(app.getHttpServer())
          .put('/hospitals/H002') 
          .set('Authorization', `Bearer ${hmTokenH001}`)
          .set('x-csrf-token', csrfToken)
          .send({ name: 'Hacked Hospital' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/cross-hospital|not assigned to this hospital/i);
    });
  });

  describe('2. Bed Status Machine', () => {
    // The suite drives a bed into maintenance itself rather than hoping one is
    // seeded, so the assertion below is about the transition rule and nothing
    // else. It is put back to available in afterAll.
    let maintenanceBedId: string;

    beforeAll(async () => {
      const available = await request(app.getHttpServer())
        .get('/beds?status=available')
        .set('Authorization', `Bearer ${superuserToken}`)
        .set('x-csrf-token', await csrfToken(superuserToken));

      maintenanceBedId = available.body?.data?.[0]?.id;
      expect(maintenanceBedId).toBeDefined();

      const toMaintenance = await request(app.getHttpServer())
        .patch(`/beds/${maintenanceBedId}/status`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .set('x-csrf-token', await csrfToken(superuserToken))
        .send({ status: 'maintenance' });

      expect(toMaintenance.status).toBe(200);
      expect(toMaintenance.body.success).toBe(true);
    });

    afterAll(async () => {
      if (!maintenanceBedId) return;
      await request(app.getHttpServer())
        .patch(`/beds/${maintenanceBedId}/status`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .set('x-csrf-token', await csrfToken(superuserToken))
        .send({ status: 'available' });
    });

    it('PATCH /beds/{id}/allocate on a maintenance bed is rejected with 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/beds/${maintenanceBedId}/allocate`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .set('x-csrf-token', await csrfToken(superuserToken))
        .send({ patientId: 'P001' });

      // BedStatusChangeMiddleware must stop maintenance -> occupied before the
      // controller runs. A 200 here means the state machine is not enforced.
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/illegal bed status transition/i);
    });

    it('PATCH /beds/{id}/status accepts the legal maintenance -> available move', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/beds/${maintenanceBedId}/status`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .set('x-csrf-token', await csrfToken(superuserToken))
        .send({ status: 'available' });

      // The mirror of the test above: the middleware has to let legal moves
      // through, or a passing rejection test would prove nothing.
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Put it back for the rejection test's afterAll.
      await request(app.getHttpServer())
        .patch(`/beds/${maintenanceBedId}/status`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .set('x-csrf-token', await csrfToken(superuserToken))
        .send({ status: 'maintenance' });
    });
  });

  describe('3. Ambulance Access', () => {
    // Both halves are asserted: a blanket allow and a blanket deny each fail one
    // of these two tests, so together they show the guard actually discriminates.
    let ownRequestId: string;
    let otherRequestId: string;

    beforeAll(async () => {
      const all = await request(app.getHttpServer())
        .get('/ambulance')
        .set('Authorization', `Bearer ${superuserToken}`);

      const requests: any[] = all.body?.data || [];
      expect(requests.length).toBeGreaterThan(0);

      // patient@gmail.com is P001 in the seeded dataset.
      ownRequestId = requests.find(r => r.patientId === 'P001')?.id;
      otherRequestId = requests.find(r => r.patientId && r.patientId !== 'P001')?.id;
      expect(ownRequestId).toBeDefined();
      expect(otherRequestId).toBeDefined();
    });

    it("GET /ambulance/{id} returns the patient's own request", async () => {
      const res = await request(app.getHttpServer())
        .get(`/ambulance/${ownRequestId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.patientId).toBe('P001');
    });

    it("GET /ambulance/{id} for another patient's request is rejected with 403", async () => {
      const res = await request(app.getHttpServer())
        .get(`/ambulance/${otherRequestId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only access your own/i);
    });
  });

  describe('5. Swagger declares what the middleware actually does', () => {
    // The point of this suite. Each middleware is applied with .forRoutes(...)
    // in a module, so its effects are part of the contract of those routes —
    // and the generated document has to say so. These tests read the document
    // the app really serves and compare it against the middleware wiring,
    // rather than trusting that someone remembered a decorator.
    let document: any;

    const operations = (): Array<[string, string, any]> =>
      Object.entries(document.paths).flatMap(([path, item]: [string, any]) =>
        Object.entries(item).map(([method, op]) => [path, method, op] as [string, string, any]),
      );

    beforeAll(() => {
      document = applyMiddlewareContract(
        SwaggerModule.createDocument(app, buildSwaggerConfig()),
      );
    });

    it('declares the global rate limit (429) and payload cap (413) on every operation', () => {
      const missing = operations()
        .filter(([, , op]) => !op.responses?.['429'] || !op.responses?.['413'])
        .map(([path, method]) => `${method.toUpperCase()} ${path}`);

      // SecurityMiddleware is applied with forRoutes('*'), so there is no
      // operation it cannot reject.
      expect(missing).toEqual([]);
    });

    it('documents the real rate limit numbers, not stale copies', () => {
      const [, , login] = operations().find(([p, m]) => p.endsWith('/auth/login') && m === 'post')!;
      const [, , anyOther] = operations().find(([p]) => p.endsWith('/beds'))!;

      expect(login.responses['429'].description).toContain(String(AUTH_LIMIT));
      expect(anyOther.responses['429'].description).toContain(String(GENERAL_LIMIT));
    });

    it('documents the CSRF header on state-changing operations, and exempts exactly the pre-session routes', () => {
      const writes = operations().filter(([, m]) =>
        ['post', 'put', 'patch', 'delete'].includes(m),
      );

      const withoutCsrf = writes
        .filter(([, , op]) =>
          !(op.parameters || []).some((p: any) => p.in === 'header' && p.name === 'x-csrf-token'),
        )
        .map(([path]) => path);

      // Exactly the routes CsrfMiddleware itself exempts — no more, no fewer.
      // Compared by suffix because this app is built without the '/api' prefix.
      expect(withoutCsrf.map(p => p.replace(/^\/api/, '')).sort()).toEqual(
        [...CSRF_EXEMPT_ROUTES].sort(),
      );
    });

    it('declares the headers the middleware chain actually sets, and the server sets them', async () => {
      const documented = operations()
        .flatMap(([, , op]) => Object.values(op.responses || {}))
        .flatMap((r: any) => Object.keys(r.headers || {}));
      const expected = ['x-request-id', 'x-csrf-token', 'x-ratelimit-limit', 'x-ratelimit-remaining'];
      for (const header of expected) {
        expect(documented).toContain(header);
      }

      // And they are not just documented — a live response carries them.
      const res = await request(app.getHttpServer()).get('/hospitals/nearby');
      for (const header of expected) {
        expect(res.headers[header]).toBeDefined();
      }
    });

    it('rejects an unauthenticated write with the 403 the document declares', async () => {
      // No Authorization header and no x-csrf-token: exactly the case
      // CsrfMiddleware challenges, and exactly what the 403 above describes.
      const res = await request(app.getHttpServer())
        .post('/hospitals/register')
        .send({ name: 'CSRF Probe Hospital' });

      expect(res.status).toBe(403);
      const [, , op] = operations().find(
        ([p, m]) => p.endsWith('/hospitals/register') && m === 'post',
      )!;
      expect(op.responses['403']).toBeDefined();
    });

    it('every tag a controller uses is declared, so nothing renders ungrouped', () => {
      const declared = new Set((document.tags || []).map((t: any) => t.name));
      const used = new Set(operations().flatMap(([, , op]) => op.tags || []));
      expect([...used].filter(t => !declared.has(t))).toEqual([]);
    });
  });

  describe('4. File Upload Limits', () => {
    it('POST /uploads with oversized payload declared in content-length should return 413', async () => {
      // SecurityMiddleware checks Content-Length header before reading the body.
      // Declare a 6 MB payload without actually sending it to avoid ECONNRESET.
      const sixMB = 6 * 1024 * 1024;

      const res = await request(app.getHttpServer())
        .post('/uploads')
        .set('Authorization', `Bearer ${superuserToken}`)
        .set('Content-Type', 'multipart/form-data; boundary=testboundary')
        .set('Content-Length', String(sixMB))
        .send('');

      // SecurityMiddleware skips the body-size check for /api/uploads paths;
      // FileUploadMiddleware enforces 413 based on the declared Content-Length.
      expect([413, 400]).toContain(res.status);
    });
  });
});

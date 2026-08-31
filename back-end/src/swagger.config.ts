import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import {
  AUTH_LIMIT,
  AUTH_PATHS,
  CSRF_EXEMPT_ROUTES,
  GENERAL_LIMIT,
  MAX_BODY_BYTES,
  MAX_UPLOAD_BYTES,
  WINDOW_MS,
} from './lodger.middleware';

/**
 * Single source of truth for the Swagger document definition.
 *
 * main.ts and generate-swagger.ts each used to carry their own copy of this
 * builder, which is how the two drifted: fourteen tags were in use by
 * controllers but declared in neither, so those groups rendered in Swagger UI
 * ungrouped and undescribed.
 *
 * Every tag a controller passes to @ApiTags() must be declared here. Keep the
 * list in sync when adding a controller.
 */
export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('NexCare Hospital Management API')
    .setDescription(
      'Complete REST API for the NexCare Hospital Administrative Operations Platform. ' +
      'Features role-based access control (RBAC), JWT authentication, and comprehensive ' +
      'modules for patients, appointments, billing, beds, ambulance, inventory, feedback, and system management.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    // NOTE: there is deliberately no x-user-role apiKey scheme here. One was
    // declared but referenced by zero operations — the role is carried inside
    // the JWT, so a second scheme only implied an authentication path that does
    // not exist.
    .addServer(
      process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`,
      'Local Server',
    )
    .addTag('Auth', 'Authentication & session management')
    .addTag('Users', 'User account management (Admin)')
    .addTag('Patients', 'Patient records & profiles')
    .addTag('Appointments', 'Appointment scheduling & tracking')
    .addTag('Billing', 'Financial operations & bill management')
    .addTag('Beds', 'Bed allocation & ward management')
    .addTag('Ambulance', 'Emergency services & ambulance requests')
    .addTag('Inventory', 'Supply chain & inventory tracking')
    .addTag('Feedback', 'Communication & feedback system')
    .addTag('System', 'Audit logs & system configuration')
    .addTag('Hospitals', 'Hospital registration, search, approval and profile details')
    .addTag('Departments', 'Hospital departments')
    .addTag('Wards', 'Ward records and capacity')
    .addTag('Equipment', 'Hospital equipment records')
    .addTag('Schedules', 'Hospital rosters and two-layer doctor scheduling')
    .addTag('Leaves', 'Staff leave requests and approvals')
    .addTag('Hierarchy', 'Region → hospital → staff org structure')
    .addTag('Revenue', 'Revenue streams, pricing and hospital health scores')
    .addTag('Payments', 'Payment intents, settlement and the platform ledger')
    .addTag('Notifications', 'In-app notifications')
    .addTag('Support Requests', 'Support tickets raised by hospitals')
    .addTag('Uploads', 'Document uploads')
    .addTag('Logs', 'Request and activity logs')
    .build();
}


/**
 * Document the application-level middleware on every operation it runs on.
 *
 * The middleware in app.module.ts is applied with `.forRoutes('*')`, so its
 * effects — a 429 from the rate limiter, a 413 from the payload cap, the CSRF
 * challenge, the headers each one sets — are part of the contract of all 235
 * operations. Declaring that by hand would mean 235 sets of decorators kept in
 * sync by discipline alone; the six missing `ApiResponse` imports that broke
 * the build on 2026-08-31 are what that costs.
 *
 * So it is applied here instead, once, to the generated document, using the
 * middleware's own exported constants. The docs cannot describe a limit the
 * middleware does not enforce, because there is only one copy of the number.
 *
 * Route-level middleware (BedStatusChange, AmbulanceAccess, HospitalAccess,
 * FileUpload) is NOT handled here — it applies to specific routes, so it is
 * declared with @ApiResponse on those controllers where a reader will see it.
 */
export function applyMiddlewareContract(document: OpenAPIObject): OpenAPIObject {
  const windowSeconds = Math.round(WINDOW_MS / 1000);
  const bodyLimitKb = Math.round(MAX_BODY_BYTES / 1024);
  const uploadLimitMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

  /** Headers every response carries, set by the global middleware chain. */
  const globalResponseHeaders = {
    'x-request-id': {
      description: 'Correlation id for this request, set by RequestLoggerMiddleware. Echoed from the request when supplied.',
      schema: { type: 'string' as const },
    },
    'x-csrf-token': {
      description: 'Current CSRF token, issued by CsrfMiddleware. Send it back in the x-csrf-token request header on unauthenticated writes.',
      schema: { type: 'string' as const },
    },
    'x-ratelimit-limit': {
      description: 'Requests permitted in the current window, set by SecurityMiddleware.',
      schema: { type: 'integer' as const },
    },
    'x-ratelimit-remaining': {
      description: 'Requests still permitted in the current window.',
      schema: { type: 'integer' as const },
    },
  };

  const stateChanging = ['post', 'put', 'patch', 'delete'];

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
      if (!operation || typeof operation !== 'object' || !operation.responses) continue;

      // Match on the suffix, not the full path: the document is generated both
      // with the '/api' global prefix (main.ts, generate-swagger.ts) and
      // without it (the E2E test app), and the limit documented must be the
      // same one the middleware applies either way.
      const unprefixed = (p: string) => p.replace(/^\/api/, '');
      const isAuthRoute = AUTH_PATHS.some(authPath => path.endsWith(unprefixed(authPath)));
      const isUpload = path.endsWith('/uploads');
      const limit = isAuthRoute ? AUTH_LIMIT : GENERAL_LIMIT;

      // SecurityMiddleware — rate limiting, on every route.
      operation.responses['429'] ??= {
        description:
          `Rate limit exceeded — SecurityMiddleware allows ${limit} requests per ` +
          `${windowSeconds}s per IP on this route. The retry-after header gives the wait in seconds.`,
      };

      // SecurityMiddleware — declared payload cap, on every route.
      operation.responses['413'] ??= {
        description: isUpload
          ? `Payload too large — FileUploadMiddleware rejects uploads over ${uploadLimitMb} MB.`
          : `Payload too large — SecurityMiddleware rejects request bodies over ${bodyLimitKb} KB.`,
      };

      // CsrfMiddleware — challenges unauthenticated state-changing requests.
      if (stateChanging.includes(method) && !CSRF_EXEMPT_ROUTES.some(r => path.endsWith(unprefixed(r)))) {
        operation.parameters = operation.parameters || [];
        const alreadyDeclared = operation.parameters.some(
          (p: any) => p?.in === 'header' && p?.name === 'x-csrf-token',
        );
        if (!alreadyDeclared) {
          operation.parameters.push({
            name: 'x-csrf-token',
            in: 'header',
            required: false,
            description:
              'CSRF token, read from the x-csrf-token response header of any preceding GET. ' +
              'Required only for writes that do not carry an Authorization: Bearer header — a ' +
              'Bearer-authenticated write is structurally immune, since a browser never attaches ' +
              'that header on its own.',
            schema: { type: 'string' },
          });
        }
        operation.responses['403'] ??= {
          description: 'CSRF token missing or invalid on an unauthenticated state-changing request.',
        };
      }

      // Applied last, so responses added above are covered too.
      for (const response of Object.values(operation.responses) as any[]) {
        if (!response || typeof response !== 'object') continue;
        response.headers = { ...globalResponseHeaders, ...(response.headers || {}) };
      }
    }
  }

  return document;
}

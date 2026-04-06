import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
//Test
import { env } from './config/env.js';
import {
  sequelize,
  testConnection,
  syncDatabase,
} from './shared/db/database.js';
import { generateSwagger, getSwaggerSpec } from './config/swagger.js';
import { logger } from './shared/logger/logger.js';
import { notFoundMiddleware } from './shared/middleware/not-found.middleware.js';
import { errorMiddleware } from './shared/middleware/error.middleware.js';
import { registerRoutes } from './route.js';
import { AuditLogModel } from './shared/db/data-source.js'; // Initialize models
import { createAuditLogMiddleware } from './modules/audit/audit.module.js';
import fs from 'fs/promises';
import path from 'path';
import { seed } from './modules/auth/repository/seed.js';
const bootstrap = async () => {
  try {
    await fs.mkdir(env.filesDir, { recursive: true });
    logger.info('Files directory ready', { path: env.filesDir });
  } catch (err) {
    logger.warn('Could not ensure files directory exists', {
      error: err.message,
    });
  }

  // Initialize database
  try {
    const connected = await testConnection();
    if (!connected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }
    logger.info('Database connected successfully');

    if (env.nodeEnv !== 'ddevelopment') {
      try {
        logger.info('Development mode: Syncing database...');
        await syncDatabase({
          force: true,
          alter: {
            drop: true,
          },
        });
        logger.info('Database synced successfully');
      } catch (err) {
        logger.error('Failed to sync database', {
          error: err.message,
          stack: err.stack,
        });
        // Don't exit on sync error, just log it
      }
    }
  } catch (err) {
    logger.error('Failed to connect to database', { error: err.message });
    process.exit(1);
  }

  // Create Express app
  const app = express();

  await seed();
  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  console.log('DEBUG: env.nodeEnv:', env.nodeEnv);
  const allowedOrigins =
    env.nodeEnv === 'production'
      ? ['https://invoice.cheche.et']
      : [
          'https://invoice.cheche.et',
          'http://localhost:3000',
          'http://localhost:5173',
        ];

  // Configure CORS with explicit origin allowlist (especially important with credentials=true)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header), e.g. curl/postman/server-to-server.
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('CORS origin not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    }),
  );
  app.use(
    express.json({
      limit: '10mb',
      type: ['application/json', 'text/json'], // Accept both application/json and text/json
    }),
  );
  // Parse URL-encoded bodies (for form data)
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
      type: ['application/x-www-form-urlencoded'],
    }),
  );

  const globalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.nodeEnv === 'production' ? 1000 : 3000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  });

  const createAuthLimiter = (
    maxProd,
    maxNonProd,
    code,
    message,
    windowMs = 10 * 60 * 1000,
  ) =>
    rateLimit({
      windowMs,
      max: env.nodeEnv === 'production' ? maxProd : maxNonProd,
      standardHeaders: true,
      legacyHeaders: false,
      message: { code, message },
    });

  const loginLimiter = createAuthLimiter(
    10,
    60,
    'LOGIN_RATE_LIMIT_EXCEEDED',
    'Too many login attempts, please try again later.',
  );
  const sendOtpLimiter = createAuthLimiter(
    5,
    30,
    'SEND_OTP_RATE_LIMIT_EXCEEDED',
    'Too many OTP requests, please wait before trying again.',
  );
  const resetPasswordLimiter = createAuthLimiter(
    10,
    50,
    'RESET_PASSWORD_RATE_LIMIT_EXCEEDED',
    'Too many password reset attempts, please try again later.',
  );
  const refreshLimiter = createAuthLimiter(
    30,
    150,
    'REFRESH_RATE_LIMIT_EXCEEDED',
    'Too many token refresh requests, please try again later.',
  );
  const authGeneralLimiter = createAuthLimiter(
    60,
    300,
    'AUTH_RATE_LIMIT_EXCEEDED',
    'Too many authentication requests, please try again later.',
  );

  app.use('/v1', globalApiLimiter);
  app.use('/v1/auth', authGeneralLimiter);
  app.use('/v1/auth/login', loginLimiter);
  app.use('/v1/auth/send-otp', sendOtpLimiter);
  app.use('/v1/auth/reset-password', resetPasswordLimiter);
  app.use('/v1/auth/refresh', refreshLimiter);

  // Audit log: record every request/response (authenticated and public)
  app.use(createAuditLogMiddleware(AuditLogModel));

  // Generate Swagger documentation
  await generateSwagger();

  // Swagger documentation
  const swaggerSpec = getSwaggerSpec();
  if (swaggerSpec) {
    const swaggerOptions = {
      customCssUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
      ],
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Cheche Invoice API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        docExpansion: 'none',
      },
    };

    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerOptions),
    );
  }

  // Serve product images from pos-api/assets at /assets/<filename> and /uploads/<filename> (for backward compatibility)
  const { default: fsSync } = await import('fs');
  const { fileURLToPath: toPath } = await import('url');
  const assetsDir = path.resolve(
    path.dirname(toPath(import.meta.url)),
    '..',
    'assets',
  );
  fsSync.mkdirSync(assetsDir, { recursive: true });
  app.use('/assets', express.static(assetsDir));
  app.use('/uploads', express.static(assetsDir));

  // Register all routes
  registerRoutes(app, '/v1');

  // Error handling middleware (must be last)
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  // Start server
  const server = app.listen(env.port, () => {
    const url =
      env.nodeEnv === 'development'
        ? `http://localhost:${env.port}`
        : ['https://invoice.cheche.et', 'https://invoice-test.cheche.et'];
    logger.info(`click here to open the swagger documentation: ${url}/docs`, {
      apiUrl: `${url}/api/v1/`,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    server.close(async () => {
      try {
        await sequelize.close();
        logger.info('Database connection closed');
      } catch (err) {
        logger.error('Error during shutdown', {
          error: err.message,
          stack: err.stack,
        });
      } finally {
        logger.info('Shutdown complete');
        process.exit(0);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

bootstrap();

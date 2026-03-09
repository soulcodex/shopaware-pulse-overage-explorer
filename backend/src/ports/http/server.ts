import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { requestLogger } from './middleware/request-logger.middleware';
import { versionGuard } from './middleware/version-guard.middleware';
import { tenantGuard } from './middleware/tenant-guard.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { addVaryHeader } from './middleware/vary-header.middleware';
import { createShopsRouter } from './routes/shops.router';
import { createHealthRouter } from './routes/health.router';
import { InMemoryShopRepository } from '../../infrastructure/persistence/in-memory/in-memory-shop.repository';
import { InMemoryUsageEventRepository } from '../../infrastructure/persistence/in-memory/in-memory-usage-event.repository';
import { SeedLoader } from '../../infrastructure/persistence/in-memory/seed-loader';
import { join } from 'path';

/**
 * Application context type
 */
export interface AppContext {
  shopRepository: InMemoryShopRepository;
  usageEventRepository: InMemoryUsageEventRepository;
}

// Shared repositories - initialized once
let shopRepository: InMemoryShopRepository;
let usageEventRepository: InMemoryUsageEventRepository;
let initialized = false;

/**
 * Reset the repositories - useful for test isolation
 */
export function resetRepositories(): void {
  shopRepository = new InMemoryShopRepository();
  usageEventRepository = new InMemoryUsageEventRepository();
  initialized = false;
}

/**
 * Initialize the repositories with seed data
 */
async function initializeRepositories(): Promise<void> {
  if (initialized) return;
  
  shopRepository = new InMemoryShopRepository();
  usageEventRepository = new InMemoryUsageEventRepository();

  // Load seed data
  const seedLoader = new SeedLoader(shopRepository, usageEventRepository);
  const seedDataPath = join(process.cwd(), 'seed-data.json');
  await seedLoader.load(seedDataPath);
  
  initialized = true;
}

/**
 * Create and configure the Hono application
 */
export async function createApp(): Promise<Hono> {
  // Ensure repositories are initialized
  await initializeRepositories();

  // Create app
  const app = new Hono();

  // Health routes (no guards, registered before API middleware)
  const healthRouter = createHealthRouter();
  app.route('/', healthRouter);

  // API routes with guards
  app.use('/api/*', requestLogger);
  app.use('/api/*', versionGuard);
  app.use('/api/*', addVaryHeader);
  app.use('/api/*', tenantGuard);

  // Shops router
  const shopsRouter = createShopsRouter(shopRepository, usageEventRepository);
  app.route('/', shopsRouter);

  // Global error handler — must use app.onError so it catches errors thrown
  // inside mounted subrouters (app.route). A use('*') middleware only wraps
  // routes registered directly on this app instance, not subrouter handlers.
  app.onError(errorHandler);

  // Swagger UI
  app.get('/docs', swaggerUI({ url: '/api/openapi' }));

  return app;
}



import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { ShopRepository } from '../../../domain/shop/repository/shop.repository.js';
import { UsageEventRepository } from '../../../domain/shop/repository/usage-event.repository.js';
import { ListShopsHandler } from '../../../application/query/list-shops/list-shops.handler.js';
import { GetShopDetailHandler } from '../../../application/query/get-shop-detail/get-shop-detail.handler.js';
import { CreateNoteHandler } from '../../../application/command/create-note/create-note.handler.js';
import { TenantId } from '../../../domain/shop/model/tenant-id.js';
import { ShopId } from '../../../domain/shop/model/shop-id.js';
import { NoteAuthor } from '../../../domain/shop/note/note-author.js';
import { type AppBindings, TENANT_ID_CONTEXT_KEY, SHOP_ID_CONTEXT_KEY, REQUEST_ID_CONTEXT_KEY } from '../types.js';

// ---------------------------------------------------------------------------
// Request / response schemas
// ---------------------------------------------------------------------------

const ListShopsQuerySchema = z.object({
  search: z.string().optional(),
  plan: z.enum(['starter', 'grow', 'scale']).optional(),
  status: z.enum(['active', 'past_due', 'cancelled']).optional(),
  sort: z.enum(['-overage_charges', '-name']).optional(),
});

const CreateNoteBodySchema = z.object({
  data: z.object({
    type: z.literal('note'),
    attributes: z.object({
      author: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      }),
      content: z.string().trim().min(1, "'content' must not be blank"),
    }),
  }),
});

const JsonApiErrorSchema = z.object({
  errors: z.array(
    z.object({
      status: z.string(),
      code: z.string(),
      title: z.string(),
      detail: z.string(),
      source: z.object({ pointer: z.string() }).optional(),
    }),
  ),
  meta: z.object({ request_id: z.string() }),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export function createShopsRouter(
  shopRepository: ShopRepository,
  usageEventRepository: UsageEventRepository,
): OpenAPIHono<AppBindings> {
  const app = new OpenAPIHono<AppBindings>({
    defaultHook: (result, c) => {
      if (result.success) return;

      const requestId = c.get(REQUEST_ID_CONTEXT_KEY) ?? 'unknown';
      const errors = result.error.issues.map((issue) => ({
        status: '400',
        code: 'VALIDATION_ERROR',
        title: 'Validation failed',
        detail: issue.message,
        source: { pointer: '/' + issue.path.join('/') },
      }));

      return c.json({ errors, meta: { request_id: requestId } }, 400, {
        Vary: 'X-API-Version',
      });
    },
  });

  const listShopsHandler = new ListShopsHandler(shopRepository, usageEventRepository);
  const getShopDetailHandler = new GetShopDetailHandler(shopRepository, usageEventRepository);
  const createNoteHandler = new CreateNoteHandler(shopRepository);

  // -------------------------------------------------------------------------
  // GET /api/shops
  // -------------------------------------------------------------------------

  const listShopsRoute = createRoute({
    method: 'get',
    path: '/api/shops',
    tags: ['Shops'],
    summary: 'List shops for tenant',
    description: 'Returns all shops scoped to the authenticated tenant with computed overage summaries.',
    request: { query: ListShopsQuerySchema },
    responses: {
      200: {
        description: 'List of shops',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(
                z.object({
                  type: z.literal('shop'),
                  id: z.string(),
                  attributes: z.object({
                    name: z.string(),
                    plan: z.enum(['starter', 'grow', 'scale']),
                    status: z.enum(['active', 'past_due', 'cancelled']),
                    usage: z.number(),
                    included_usage: z.number(),
                    overage_charges: z.number(),
                    created_at: z.string(),
                    updated_at: z.string(),
                  }),
                }),
              ),
              meta: z.object({ request_id: z.string() }),
            }),
          },
        },
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: JsonApiErrorSchema } } },
    },
  });

  app.openapi(listShopsRoute, async (c) => {
    const tenantId = new TenantId(c.get(TENANT_ID_CONTEXT_KEY));
    const query = c.req.valid('query');

    const shops = await listShopsHandler.handle({ tenantId, filters: query });

    return c.json({ data: shops, meta: { request_id: c.get(REQUEST_ID_CONTEXT_KEY) } }, 200);
  });

  // -------------------------------------------------------------------------
  // GET /api/shops/:shopId
  // -------------------------------------------------------------------------

  const getShopDetailRoute = createRoute({
    method: 'get',
    path: '/api/shops/{shopId}',
    tags: ['Shops'],
    summary: 'Get shop detail',
    description: 'Returns full detail for a shop including billing cycle, overage summary, usage events and notes.',
    request: {
      params: z.object({ shopId: z.string() }),
    },
    responses: {
      200: {
        description: 'Shop detail',
        content: {
          'application/json': {
            schema: z.object({
              data: z.object({
                type: z.literal('shop'),
                id: z.string(),
                attributes: z.object({
                  name: z.string(),
                  plan: z.enum(['starter', 'grow', 'scale']),
                  status: z.enum(['active', 'past_due', 'cancelled']),
                  billing_cycle_start: z.string(),
                  billing_cycle_end: z.string(),
                  summary: z.object({
                    total_orders: z.number(),
                    included_orders: z.number(),
                    overage_orders: z.number(),
                    overage_charges: z.number(),
                  }),
                  usage: z.array(
                    z.object({
                      id: z.string(),
                      timestamp: z.string(),
                      orders: z.number(),
                      gmv_eur: z.number(),
                    }),
                  ),
                  notes: z.array(
                    z.object({
                      id: z.string(),
                      author: z.object({ id: z.string(), name: z.string() }),
                      content: z.string(),
                      created_at: z.string(),
                    }),
                  ),
                  created_at: z.string(),
                  updated_at: z.string(),
                }),
              }),
              meta: z.object({ request_id: z.string() }),
            }),
          },
        },
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: JsonApiErrorSchema } } },
      404: { description: 'Shop not found', content: { 'application/json': { schema: JsonApiErrorSchema } } },
    },
  });

  app.openapi(getShopDetailRoute, async (c) => {
    const { shopId } = c.req.valid('param');
    const tenantId = new TenantId(c.get(TENANT_ID_CONTEXT_KEY));

    c.set(SHOP_ID_CONTEXT_KEY, shopId);

    // ShopNotFoundException (HttpException) propagates to the global error handler — no local catch needed
    const shop = await getShopDetailHandler.handle({ tenantId, shopId: new ShopId(shopId) });

    return c.json({ data: shop, meta: { request_id: c.get(REQUEST_ID_CONTEXT_KEY) } }, 200);
  });

  // -------------------------------------------------------------------------
  // POST /api/shops/:shopId/notes
  // -------------------------------------------------------------------------

  const createNoteRoute = createRoute({
    method: 'post',
    path: '/api/shops/{shopId}/notes',
    tags: ['Shops'],
    summary: 'Create support note',
    description: 'Creates a new internal support note for a shop.',
    request: {
      params: z.object({ shopId: z.string() }),
      body: {
        content: { 'application/json': { schema: CreateNoteBodySchema } },
        required: true,
      },
    },
    responses: {
      204: { description: 'Note created successfully' },
      400: { description: 'Validation error', content: { 'application/json': { schema: JsonApiErrorSchema } } },
      404: { description: 'Shop not found', content: { 'application/json': { schema: JsonApiErrorSchema } } },
    },
  });

  app.openapi(createNoteRoute, async (c) => {
    const { shopId } = c.req.valid('param');
    const body = c.req.valid('json');
    const tenantId = new TenantId(c.get(TENANT_ID_CONTEXT_KEY));

    c.set(SHOP_ID_CONTEXT_KEY, shopId);

    const author = new NoteAuthor({
      id: body.data.attributes.author.id,
      name: body.data.attributes.author.name,
    });

    // ShopNotFoundException (HttpException) propagates to the global error handler — no local catch needed
    await createNoteHandler.handle({
      tenantId,
      shopId: new ShopId(shopId),
      author,
      content: body.data.attributes.content,
    });

    return c.body(null, 204);
  });

  // -------------------------------------------------------------------------
  // OpenAPI spec endpoint
  // -------------------------------------------------------------------------

  app.doc31('/api/openapi', {
    openapi: '3.1.0',
    info: {
      title: 'Pulse Overage Explorer API',
      version: '1.0.0',
      description: 'Multi-tenant HTTP API for shop usage overage calculation and internal support notes.',
    },
  });

  return app;
}

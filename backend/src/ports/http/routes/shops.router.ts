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
import { TENANT_ID_CONTEXT_KEY, SHOP_ID_CONTEXT_KEY, REQUEST_ID_CONTEXT_KEY } from '../types.js';

// Schema for list shops query params
const ListShopsQuerySchema = z.object({
  search: z.string().optional(),
  plan: z.enum(['starter', 'grow', 'scale']).optional(),
  status: z.enum(['active', 'past_due', 'cancelled']).optional(),
  sort: z.enum(['-overage_charges', '-name']).optional(),
});

// Schema for create note request body
const CreateNoteRequestSchema = z.object({
  data: z.object({
    type: z.literal('note'),
    attributes: z.object({
      author: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      }),
      content: z.string().min(1),
    }),
  }),
});

// Route definitions
export function createShopsRouter(
  shopRepository: ShopRepository,
  usageEventRepository: UsageEventRepository
): OpenAPIHono {
  const app = new OpenAPIHono();

  const listShopsHandler = new ListShopsHandler(shopRepository, usageEventRepository);
  const getShopDetailHandler = new GetShopDetailHandler(shopRepository, usageEventRepository);
  const createNoteHandler = new CreateNoteHandler(shopRepository);

  // GET /api/shops
  const listShopsRoute = createRoute({
    method: 'get',
    path: '/api/shops',
    tags: ['Shops'],
    summary: 'List all shops',
    description: 'Returns a list of shops for the authenticated tenant',
    request: {
      query: ListShopsQuerySchema,
    },
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
                })
              ),
              meta: z.object({
                request_id: z.string(),
              }),
            }),
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: z.object({
              errors: z.array(z.object({
                status: z.string(),
                code: z.string(),
                title: z.string(),
                detail: z.string(),
              })),
              meta: z.object({
                request_id: z.string(),
              }),
            }),
          },
        },
      },
    },
  });

  // @ts-expect-error - Hono/zod-openapi typing issue
  app.openapi(listShopsRoute, async (c) => {
    const tenantId = new TenantId((c as any).get(TENANT_ID_CONTEXT_KEY));
    const query = c.req.query();
    const filters = {
      search: query.search,
      plan: query.plan as 'starter' | 'grow' | 'scale' | undefined,
      status: query.status as 'active' | 'past_due' | 'cancelled' | undefined,
      sort: query.sort as '-overage_charges' | '-name' | undefined,
    };

    const shops = await listShopsHandler.handle({ tenantId, filters });

    return c.json({
      data: shops,
      meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) },
    });
  });

  // GET /api/shops/:shopId
  const getShopDetailRoute = createRoute({
    method: 'get',
    path: '/api/shops/{shopId}',
    tags: ['Shops'],
    summary: 'Get shop detail',
    description: 'Returns detailed information about a specific shop',
    request: {
      params: z.object({
        shopId: z.string(),
      }),
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
                  usage: z.array(z.object({
                    id: z.string(),
                    timestamp: z.string(),
                    orders: z.number(),
                    gmv_eur: z.number(),
                  })),
                  notes: z.array(z.object({
                    id: z.string(),
                    author: z.object({
                      id: z.string(),
                      name: z.string(),
                    }),
                    content: z.string(),
                    created_at: z.string(),
                  })),
                  created_at: z.string(),
                  updated_at: z.string(),
                }),
              }),
              meta: z.object({
                request_id: z.string(),
              }),
            }),
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: z.object({
              errors: z.array(z.object({
                status: z.string(),
                code: z.string(),
                title: z.string(),
                detail: z.string(),
              })),
              meta: z.object({
                request_id: z.string(),
              }),
            }),
          },
        },
      },
      404: {
        description: 'Shop not found',
        content: {
          'application/json': {
            schema: z.object({
              errors: z.array(z.object({
                status: z.string(),
                code: z.string(),
                title: z.string(),
                detail: z.string(),
              })),
              meta: z.object({
                request_id: z.string(),
              }),
            }),
          },
        },
      },
    },
  });

  // @ts-expect-error - Hono/zod-openapi typing issue
  app.openapi(getShopDetailRoute, async (c) => {
    const { shopId } = c.req.param();
    const tenantId = new TenantId((c as any).get(TENANT_ID_CONTEXT_KEY) as string);
    
    // Set shop ID for logging
    (c as any).set(SHOP_ID_CONTEXT_KEY, shopId);

    try {
      const shop = await getShopDetailHandler.handle({
        tenantId,
        shopId: new ShopId(shopId),
      });

      return c.json({
        data: shop,
        meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found') && error.message.includes('Shop with id')) {
        const match = error.message.match(/Shop with id '([^']+)'/);
        const foundShopId = match ? match[1] : shopId;
        return c.json(
          {
            errors: [
              {
                status: '404',
                code: 'SHOP_NOT_FOUND',
                title: 'Shop not found',
                detail: `No shop with id '${foundShopId}' was found`,
              },
            ],
            meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
          },
          404,
          { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
        );
      }
      throw error;
    }
  });

  // POST /api/shops/:shopId/notes
  const createNoteRoute = createRoute({
    method: 'post',
    path: '/api/shops/{shopId}/notes',
    tags: ['Shops'],
    summary: 'Create a support note',
    description: 'Creates a new support note for a shop',
    request: {
      params: z.object({
        shopId: z.string(),
      }),
    },
    responses: {
      204: {
        description: 'Note created successfully',
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: z.object({
              errors: z.array(z.object({
                status: z.string(),
                code: z.string(),
                title: z.string(),
                detail: z.string(),
                source: z.object({
                  pointer: z.string(),
                }).optional(),
              })),
              meta: z.object({
                request_id: z.string(),
              }),
            }),
          },
        },
      },
      404: {
        description: 'Shop not found',
        content: {
          'application/json': {
            schema: z.object({
              errors: z.array(z.object({
                status: z.string(),
                code: z.string(),
                title: z.string(),
                detail: z.string(),
              })),
              meta: z.object({
                request_id: z.string(),
              }),
            }),
          },
        },
      },
    },
  });

  app.openapi(createNoteRoute, async (c) => {
    const { shopId } = c.req.param();
    const tenantId = new TenantId((c as any).get(TENANT_ID_CONTEXT_KEY) as string);

    // Parse and validate request body manually using Zod
    let bodyRaw;
    try {
      bodyRaw = await c.req.json();
    } catch {
      return c.json(
        {
          errors: [
            {
              status: '400',
              code: 'VALIDATION_ERROR',
              title: 'Validation failed',
              detail: 'Invalid JSON body',
            },
          ],
          meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
        },
        400,
        { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
      );
    }

    // Validate with Zod
    const parseResult = CreateNoteRequestSchema.safeParse(bodyRaw);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      if (!firstIssue) {
        return c.json(
          {
            errors: [
              {
                status: '400',
                code: 'VALIDATION_ERROR',
                title: 'Validation failed',
                detail: 'Unknown validation error',
              },
            ],
            meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
          },
          400,
          { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
        );
      }
      const pointer = '/' + firstIssue.path.join('/');
      return c.json(
        {
          errors: [
            {
              status: '400',
              code: 'VALIDATION_ERROR',
              title: 'Validation failed',
              detail: firstIssue.message,
              source: { pointer },
            },
          ],
          meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
        },
        400,
        { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
      );
    }

    const body = parseResult.data;
    
    // Additional validation
    if (body.data.type !== 'note') {
      return c.json(
        {
          errors: [
            {
              status: '400',
              code: 'VALIDATION_ERROR',
              title: 'Validation failed',
              detail: "data.type must be 'note'",
              source: { pointer: '/data/type' },
            },
          ],
          meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
        },
        400,
        { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
      );
    }

    if (!body.data.attributes.content || body.data.attributes.content.trim().length === 0) {
      return c.json(
        {
          errors: [
            {
              status: '400',
              code: 'VALIDATION_ERROR',
              title: 'Validation failed',
              detail: "'content' must not be blank",
              source: { pointer: '/data/attributes/content' },
            },
          ],
          meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
        },
        400,
        { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
      );
    }

    if (!body.data.attributes.author) {
      return c.json(
        {
          errors: [
            {
              status: '400',
              code: 'VALIDATION_ERROR',
              title: 'Validation failed',
              detail: "'author' is required",
              source: { pointer: '/data/attributes/author' },
            },
          ],
          meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
        },
        400,
        { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
      );
    }

    const author = new NoteAuthor({
      id: body.data.attributes.author.id,
      name: body.data.attributes.author.name,
    });

    try {
      await createNoteHandler.handle({
        tenantId,
        shopId: new ShopId(shopId),
        author,
        content: body.data.attributes.content,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found') && error.message.includes('Shop with id')) {
        return c.json(
          {
            errors: [
              {
                status: '404',
                code: 'SHOP_NOT_FOUND',
                title: 'Shop not found',
                detail: `No shop with id '${shopId}' was found`,
              },
            ],
            meta: { request_id: (c as any).get(REQUEST_ID_CONTEXT_KEY) as string },
          },
          404,
          { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
        );
      }
      throw error;
    }

    return c.body(null, 204, {
      'Content-Type': 'application/json',
      'Vary': 'X-API-Version',
    });
  });

  // Add OpenAPI spec endpoint
  app.doc31('/api/openapi', {
    openapi: '3.1.0',
    info: {
      title: 'Pulse Overage Explorer API',
      version: '1.0.0',
      description: 'API for managing shops and support notes',
    },
  });

  return app;
}

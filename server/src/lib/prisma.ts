import { Prisma, PrismaClient } from '@prisma/client';
import { env, isProduction } from '../config/env.ts';
import { getStore, runInTransaction, TenantContextMissingError } from './tenant-context.ts';

type Args = Record<string, unknown>;

// node --watch reloads modules on every save. Without this cache each reload would open a new pool.
const globalForPrisma = globalThis as unknown as { eduflowPrisma?: PrismaClient };

const base =
  globalForPrisma.eduflowPrisma ??
  new PrismaClient({ datasourceUrl: env.DATABASE_URL, log: ['warn', 'error'] });

if (!isProduction) globalForPrisma.eduflowPrisma = base;

/** Reference data every tenant reads and no tenant owns. */
const PLATFORM_MODELS = new Set([
  'Country',
  'Currency',
  'ExchangeRate',
  'Plan',
  'PlanPrice',
  'PlanFeature',
  'Permission',
]);

/** Rows with a null organizationId here are shared defaults: readable by all, writable by none. */
const SHARED_READ_MODELS = new Set([
  'Role',
  'RolePermission',
  'NotificationTemplate',
  'PolicyDocument',
]);

// Built from the schema at start-up, so a model added next year can never be forgotten.
const TENANT_MODELS = new Set(
  Prisma.dmmf.datamodel.models
    .filter((model) => model.fields.some((field) => field.name === 'organizationId'))
    .map((model) => model.name),
);

const READ_OPS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn']);

/** Appends the filter with AND, which works for plain and for unique "where" inputs alike. */
function addFilter(args: Args, filter: Args): void {
  const where = (args['where'] ?? {}) as Args;
  const existing = where['AND'];
  const and = existing === undefined ? [] : Array.isArray(existing) ? existing : [existing];
  args['where'] = { ...where, AND: [...and, filter] };
}

function stamp(row: Args, orgId: string): Args {
  if (row['organizationId'] !== undefined && row['organizationId'] !== orgId) {
    throw new Error('Tenant mismatch: data.organizationId differs from the tenant context');
  }
  return { ...row, organizationId: orgId };
}

function scopeArgs(model: string, operation: string, input: Args, orgId: string): Args {
  const args: Args = { ...input };

  if (model === 'Organization') {
    if (!READ_OPS.has(operation) && operation !== 'update') {
      throw new Error(`Organization.${operation} is allowed in the platform context only`);
    }
    addFilter(args, { id: orgId });
    return args;
  }

  if (CREATE_OPS.has(operation)) {
    const data = args['data'];
    args['data'] = Array.isArray(data)
      ? data.map((row) => stamp(row as Args, orgId))
      : stamp(data as Args, orgId);
    return args;
  }

  const own = { organizationId: orgId };
  const sharedRead = SHARED_READ_MODELS.has(model) && READ_OPS.has(operation);
  addFilter(args, sharedRead ? { OR: [own, { organizationId: null }] } : own);

  if (operation === 'upsert') args['create'] = stamp(args['create'] as Args, orgId);
  const patch = (operation === 'upsert' ? args['update'] : args['data']) as Args | undefined;
  if (patch?.['organizationId'] !== undefined) throw new Error('organizationId can never change');
  return args;
}

/**
 * The one client the whole server uses. The extension is the seat belt: it adds organizationId
 * to every query and stamps it on every create. PostgreSQL row-level security is the wall,
 * and it reads the `app.current_org` setting written just before each query.
 */
export const db = base.$extends({
  name: 'tenant-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (PLATFORM_MODELS.has(model)) return query(args);

        const store = getStore();
        if (store === undefined) throw new TenantContextMissingError(`${model}.${operation}`);
        if (model !== 'Organization' && !TENANT_MODELS.has(model)) {
          throw new Error(`${model} is neither a platform model nor a tenant model`);
        }

        // `query` is typed as the union of every operation's arguments across 189 models, which
        // TypeScript cannot represent. The value is checked at run time by scopeArgs, so the
        // argument is handed back through `never` rather than re-deriving that union.
        const scoped = (
          store.kind === 'tenant'
            ? scopeArgs(model, operation, args as Args, store.orgId)
            : (args as Args)
        ) as never; // Platform context: no filter. The reason is already in the log.

        // Inside tenantTransaction() the setting is already on this connection.
        if (store.inTransaction === true) return query(scoped);

        const setting =
          store.kind === 'tenant'
            ? base.$executeRaw`SELECT set_config('app.current_org', ${store.orgId}, true)`
            : base.$executeRaw`SELECT set_config('app.platform_bypass', 'on', true)`;

        // The cast is the documented Prisma pattern: inside an extension the wrapped query
        // is already a Prisma promise, but its public type does not say so.
        const wrapped = query(scoped) as Prisma.PrismaPromise<unknown>;
        const [, result] = await base.$transaction([setting, wrapped]);
        return result;
      },
    },
  },
});

export type TenantTx = Omit<
  typeof db,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/** One interactive transaction: the tenant setting is written once, then fn runs on tx. */
export function tenantTransaction<T>(fn: (tx: TenantTx) => Promise<T>): Promise<T> {
  const store = getStore();
  if (store === undefined) throw new TenantContextMissingError('tenantTransaction()');
  return db.$transaction(
    async (tx) => {
      if (store.kind === 'tenant') {
        await tx.$executeRaw`SELECT set_config('app.current_org', ${store.orgId}, true)`;
      } else {
        await tx.$executeRaw`SELECT set_config('app.platform_bypass', 'on', true)`;
      }
      return runInTransaction(() => fn(tx));
    },
    { maxWait: 5_000, timeout: 10_000 },
  );
}

/** Used by the readiness probe. Returns false instead of throwing when PostgreSQL is down. */
export async function databaseIsReachable(): Promise<boolean> {
  try {
    await base.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectPrisma(): Promise<void> {
  await base.$disconnect();
}

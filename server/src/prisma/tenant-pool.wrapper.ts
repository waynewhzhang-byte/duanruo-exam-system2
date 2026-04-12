import { Pool, PoolClient, QueryConfig, QueryResult } from 'pg';

const TENANT_TABLES = new Set([
  'exams',
  'positions',
  'subjects',
  'applications',
  'review_tasks',
  'reviews',
  'exam_reviewers',
  'exam_scores',
  'payment_orders',
  'tickets',
  'ticket_number_rules',
  'ticket_sequences',
  'venues',
  'rooms',
  'seat_assignments',
  'allocation_batches',
  'files',
  'application_audit_logs',
]);

let getTenantSchemaFn: () => string | undefined = () => undefined;

export function setTenantSchemaGetter(fn: () => string | undefined): void {
  getTenantSchemaFn = fn;
}

function rewriteSqlSchema(sql: string, targetSchema: string): string {
  if (targetSchema === 'public' || !sql.includes('"public".')) {
    return sql;
  }

  return sql.replace(
    /"public"\.("[^"]+")/g,
    (match: string, quotedTable: string): string => {
      const name = quotedTable.slice(1, -1);
      if (TENANT_TABLES.has(name)) {
        return `"${targetSchema}".${quotedTable}`;
      }
      return match;
    },
  );
}

type QueryCallback = (err: Error, result: QueryResult) => void;

/** Narrowed pg `query` shape used by this wrapper (Pool + PoolClient). */
type PgQueryFn = {
  (queryText: string, callback?: QueryCallback): Promise<QueryResult>;
  (
    queryText: string,
    values: unknown[],
    callback?: QueryCallback,
  ): Promise<QueryResult>;
  (queryConfig: QueryConfig, callback?: QueryCallback): Promise<QueryResult>;
};

interface TenantPoolClient extends PoolClient {
  release(err?: Error | boolean): void;
}

function createWrappedQuery(originalQuery: PgQueryFn): PgQueryFn {
  const wrappedQuery = (
    sqlOrConfig: string | QueryConfig,
    arg2?: unknown[] | QueryCallback,
    arg3?: QueryCallback,
  ): Promise<QueryResult> => {
    const schema = getTenantSchemaFn() || 'public';

    if (typeof sqlOrConfig === 'string') {
      const modifiedSql = rewriteSqlSchema(sqlOrConfig, schema);
      if (arg2 === undefined) {
        return originalQuery(modifiedSql);
      }
      if (typeof arg2 === 'function') {
        return originalQuery(modifiedSql, arg2);
      }
      const values = arg2;
      if (arg3 === undefined) {
        return originalQuery(modifiedSql, values);
      }
      return originalQuery(modifiedSql, values, arg3);
    }

    const modifiedConfig: QueryConfig = {
      ...sqlOrConfig,
      text: rewriteSqlSchema(sqlOrConfig.text, schema),
    };
    if (typeof arg2 === 'function') {
      return originalQuery(modifiedConfig, arg2);
    }
    return originalQuery(modifiedConfig);
  };

  return wrappedQuery as PgQueryFn;
}

class TenantPoolWrapper {
  private pool: Pool;
  private _query: PgQueryFn;

  constructor(pool: Pool) {
    this.pool = pool;
    this._query = createWrappedQuery(
      pool.query.bind(pool) as unknown as PgQueryFn,
    );
  }

  get query(): PgQueryFn {
    return this._query;
  }

  async connect(): Promise<TenantPoolClient> {
    const client = await this.pool.connect();
    const originalQuery = client.query.bind(client) as unknown as PgQueryFn;
    const mutable = client as PoolClient & { query: PgQueryFn };
    mutable.query = createWrappedQuery(originalQuery);
    return client as TenantPoolClient;
  }

  async end(): Promise<void> {
    return this.pool.end();
  }

  on(
    event: 'error' | 'connect' | 'acquire' | 'release' | 'remove',
    listener: (...args: unknown[]) => void,
  ): this {
    this.pool.on(event, listener);
    return this;
  }

  removeListener(
    event: 'error' | 'connect' | 'acquire' | 'release' | 'remove',
    listener: (...args: unknown[]) => void,
  ): this {
    this.pool.removeListener(event, listener);
    return this;
  }
}

export function createTenantPool(connectionString: string): TenantPoolWrapper {
  const pool = new Pool({ connectionString });
  return new TenantPoolWrapper(pool);
}

export { TenantPoolWrapper };

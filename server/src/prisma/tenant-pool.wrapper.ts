import { Pool, PoolClient, QueryConfig, QueryResult, PoolConfig } from 'pg';

let _getTenantSchema: () => string | undefined = () => undefined;

export function setTenantSchemaGetter(fn: () => string | undefined): void {
  _getTenantSchema = fn;
}

function getCurrentTenantSchema(): string | undefined {
  return _getTenantSchema();
}

function rewriteSqlSchema(sql: string, targetSchema: string): string {
  if (targetSchema === 'public' || targetSchema === 'tenant') {
    return sql;
  }

  return sql.replaceAll(
    /"tenant"\.("[^"]+")/g,
    (_match: string, quotedTable: string) => {
      return `"${targetSchema}".${quotedTable}`;
    },
  );
}

type QueryCallback = (err: Error, result: QueryResult) => void;

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
    const schema = getCurrentTenantSchema() || 'public';

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
  private readonly pool: Pool;
  private readonly _query: PgQueryFn;

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
  const pool = new Pool(createPoolConfig(connectionString));
  return new TenantPoolWrapper(pool);
}

export { TenantPoolWrapper };

function createPoolConfig(connectionString: string): PoolConfig {
  try {
    const parsed = new URL(connectionString);
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));

    const config: PoolConfig = {
      host: parsed.hostname || undefined,
      port: parsed.port ? Number(parsed.port) : undefined,
      user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password
        ? decodeURIComponent(parsed.password)
        : undefined,
      database: database || undefined,
    };

    const sslMode = parsed.searchParams.get('sslmode');
    if (sslMode && sslMode !== 'disable') {
      config.ssl = { rejectUnauthorized: false };
    }

    return config;
  } catch {
    return { connectionString };
  }
}

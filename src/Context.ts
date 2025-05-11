import { Handler, sql } from 'dblink-core';
import ResultSet from 'dblink-core/src/model/ResultSet.js';
import { IEntityType } from 'dblink-core/src/types.js';
import { cloneDeep } from 'lodash-es';
import { Readable } from 'node:stream';
import TableSet from './collection/TableSet.js';
import Connection from './model/Connection.js';

/**
 * Database Context
 *
 * @export
 * @class Context
 * @typedef {Context}
 */
export default class Context {
  /**
   * Database Handler
   *
   * @private
   * @type {!Handler}
   */
  readonly handler!: Handler;

  /**
   * Database Connection
   *
   * @private
   * @type {(Connection | null)}
   */
  private connection: Connection | null = null;

  /**
   * Logger
   *
   * @private
   * @type {{ log: (...args: unknown[]) => void }}
   */
  private readonly logger: { log: (...args: unknown[]) => void };

  /**
   * Entity Type to TableSet Map
   *
   * @public
   * @type {Map<types.IEntityType<object>, TableSet<object>>}
   */
  public tableSetMap: Map<IEntityType<object>, TableSet<object>> = new Map();

  /**
   * Creates an instance of Context.
   *
   * @constructor
   * @param {Handler} handler
   * @param {?{ logger: { log: (...args: unknown[]) => void } }} [optns]
   */
  constructor(handler: Handler, optns?: { logger: { log: (...args: unknown[]) => void } }) {
    this.handler = handler;
    this.logger = optns?.logger || console;
  }

  /**
   * Log Function
   *
   * @param {...unknown[]} arg
   */
  log(...arg: unknown[]) {
    this.logger.log(...arg);
  }

  /**
   * Initialize Context
   *
   * @async
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    await this.handler.init();

    Reflect.ownKeys(this).forEach(key => {
      const tableSet = Reflect.get(this, key);
      if (!(tableSet instanceof TableSet)) return;

      tableSet.context = this;
      this.tableSetMap.set(tableSet.getEntityType(), tableSet);
    });
  }

  /**
   * Run string query
   *
   * @async
   * @param {string} query
   * @returns {Promise<ResultSet>}
   */
  async run(query: string): Promise<ResultSet> {
    const conn = this.connection ?? this.handler;
    return conn.run(query);
  }

  /**
   * Execute Statement
   *
   * @async
   * @param {(sql.Statement | sql.Statement[])} stmt
   * @returns {Promise<ResultSet>}
   */
  async runStatement(stmt: sql.Statement | sql.Statement[]): Promise<ResultSet> {
    const conn = this.connection ?? this.handler;
    return conn.runStatement(stmt);
  }

  /**
   * Strea string query
   *
   * @async
   * @param {string} query
   * @returns {Promise<Readable>}
   */
  async stream(query: string): Promise<Readable> {
    const conn = this.connection ?? this.handler;
    return await conn.stream(query);
  }

  /**
   * Stream Statement
   *
   * @async
   * @param {(sql.Statement | sql.Statement[])} query
   * @returns {Promise<Readable>}
   */
  async streamStatement(query: sql.Statement | sql.Statement[]): Promise<Readable> {
    const conn = this.connection ?? this.handler;
    return await conn.streamStatement(query);
  }

  /**
   * Initialize a new transaction
   * Creates a cloned Context with its own transaction
   *
   * @async
   * @returns {Promise<this>} A new Context instance with an active transaction
   */
  async initTransaction(): Promise<this> {
    // Create Clone
    const res = cloneDeep(this);

    const keys = Reflect.ownKeys(res);
    keys.forEach(key => {
      const prop = Reflect.get(res, key);
      if (prop instanceof TableSet) {
        prop.context = res;
      }
    });

    const nativeConn = await this.handler.getConnection();
    res.connection = new Connection(res.handler, nativeConn);
    await res.connection.initTransaction();
    return res;
  }

  /**
   * Commit Transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async commit(): Promise<void> {
    if (!this.connection) throw new TypeError('Transaction Not Started');
    await this.connection.commit();
    await this.connection.close();
  }

  /**
   * Rollback Transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async rollback(): Promise<void> {
    if (!this.connection) throw new TypeError('Transaction Not Started');
    await this.connection.rollback();
    await this.connection.close();
  }
}

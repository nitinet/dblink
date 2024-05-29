import Handler from 'dblink-core/lib/Handler.js';
import ResultSet from 'dblink-core/lib/model/ResultSet';
import Statement from 'dblink-core/lib/sql/Statement';
import { Readable } from 'node:stream';

/**
 * Connection
 *
 * @export
 * @class Connection
 * @typedef {Connection}
 */
export default class Connection {
  /**
   * Database handler
   *
   * @private
   * @type {Handler}
   */
  private handler: Handler;

  /**
   * Database Connection
   *
   * @type {*}
   */
  private conn: any = null;

  /**
   * Creates an instance of Connection.
   *
   * @constructor
   * @param {Handler} handler
   * @param {?*} [conn]
   */
  constructor(handler: Handler, conn?: any) {
    this.handler = handler;
    this.conn = conn;
  }

  /**
   * Run string query
   *
   * @async
   * @param {string} query
   * @returns {Promise<ResultSet>}
   */
  async run(query: string): Promise<ResultSet> {
    return this.handler.run(query, this.conn);
  }

  /**
   * Run Statement
   *
   * @param {(Statement | Statement[])} query
   * @returns {Promise<ResultSet>}
   */
  runStatement(query: Statement | Statement[]): Promise<ResultSet> {
    return this.handler.runStatement(query, this.conn);
  }

  /**
   * Stream query
   *
   * @param {string} query
   * @returns {Promise<Readable>}
   */
  stream(query: string): Promise<Readable> {
    return this.handler.stream(query, this.conn);
  }

  /**
   * Stream Statement
   *
   * @param {(Statement | Statement[])} query
   * @returns {Promise<Readable>}
   */
  streamStatement(query: Statement | Statement[]): Promise<Readable> {
    return this.handler.streamStatement(query, this.conn);
  }

  /**
   * Initialize Transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async initTransaction(): Promise<void> {
    await this.handler.initTransaction(this.conn);
  }

  /**
   * Commit Transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async commit(): Promise<void> {
    await this.handler.commit(this.conn);
  }

  /**
   * Rollback Transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async rollback(): Promise<void> {
    await this.handler.rollback(this.conn);
  }

  /**
   * Close Connection
   *
   * @async
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    await this.handler.close(this.conn);
    this.conn = null;
  }
}

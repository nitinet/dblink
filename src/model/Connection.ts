import Handler from 'dblink-core/src/Handler.js';
import ResultSet from 'dblink-core/src/model/ResultSet';
import Statement from 'dblink-core/src/sql/Statement';
import { Readable } from 'node:stream';

/**
 * Connection class
 * Manages database connections and transaction operations
 *
 * @export
 * @class Connection
 * @typedef {Connection}
 */
export default class Connection {
  /**
   * Database handler for managing database operations
   *
   * @private
   * @type {Handler}
   */
  private readonly handler: Handler;

  /**
   * Native database connection
   *
   * @type {*}
   */
  private conn: unknown = null;

  /**
   * Creates an instance of Connection.
   *
   * @constructor
   * @param {Handler} handler - The database handler
   * @param {unknown} conn - The native database connection
   */
  constructor(handler: Handler, conn?: unknown) {
    this.handler = handler;
    this.conn = conn;
  }

  /**
   * Run string query
   * Executes a SQL query string and returns the result set
   *
   * @async
   * @param {string} query - The SQL query string
   * @returns {Promise<ResultSet>} - The result set of the query
   */
  async run(query: string): Promise<ResultSet> {
    return this.handler.run(query, undefined, this.conn);
  }

  /**
   * Run Statement
   * Executes a SQL statement or an array of statements and returns the result set
   *
   * @param {(Statement | Statement[])} query - The SQL statement or array of statements
   * @returns {Promise<ResultSet>} - The result set of the statement(s)
   */
  runStatement(query: Statement | Statement[]): Promise<ResultSet> {
    return this.handler.runStatement(query, this.conn);
  }

  /**
   * Stream query
   * Executes a SQL query string and returns a readable stream of the result set
   *
   * @param {string} query - The SQL query string
   * @returns {Promise<Readable>} - A readable stream of the result set
   */
  stream(query: string): Promise<Readable> {
    return this.handler.stream(query, undefined, this.conn);
  }

  /**
   * Stream Statement
   * Executes a SQL statement or an array of statements and returns a readable stream of the result set
   *
   * @param {(Statement | Statement[])} query - The SQL statement or array of statements
   * @returns {Promise<Readable>} - A readable stream of the result set
   */
  streamStatement(query: Statement | Statement[]): Promise<Readable> {
    return this.handler.streamStatement(query, this.conn);
  }

  /**
   * Initialize Transaction
   * Begins a new database transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async initTransaction(): Promise<void> {
    await this.handler.initTransaction(this.conn);
  }

  /**
   * Commit Transaction
   * Commits the current database transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async commit(): Promise<void> {
    await this.handler.commit(this.conn);
  }

  /**
   * Rollback Transaction
   * Rolls back the current database transaction
   *
   * @async
   * @returns {Promise<void>}
   */
  async rollback(): Promise<void> {
    await this.handler.rollback(this.conn);
  }

  /**
   * Close Connection
   * Closes the database connection
   *
   * @async
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    await this.handler.close(this.conn);
    this.conn = null;
  }
}

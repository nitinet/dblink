import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Handler } from 'dblink-core';
import type ResultSet from 'dblink-core/src/model/ResultSet.js';
import { Readable } from 'node:stream';

// Create a base mock result
const baseMockResult = {
  rows: [],
  fields: [],
  error: null
} as ResultSet;

// Mock the modules
jest.mock(
  'dblink-core',
  () => ({
    Handler: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  'dblink-core/src/model/ResultSet.js',
  () => {
    return jest.fn().mockImplementation(() => ({ ...baseMockResult }));
  },
  { virtual: true }
);

jest.mock(
  'dblink-core/src/sql/index.js',
  () => ({
    Statement: jest.fn().mockImplementation(command => ({
      command,
      collection: { value: null },
      columns: []
    })),
    types: {
      Command: {
        SELECT: 'SELECT',
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE'
      }
    }
  }),
  { virtual: true }
);

import { Statement, types } from 'dblink-core/src/sql/index.js';
import Connection from '../../model/Connection.js';

// Create a complete mock of Handler
const createMockHandler = () => {
  const handler = {
    config: {
      host: 'localhost',
      port: 5432,
      username: 'test',
      password: 'test',
      database: 'test'
    },
    run: jest.fn(),
    runStatement: jest.fn(),
    streamStatement: jest.fn(),
    getConnection: jest.fn(),
    initTransaction: jest.fn(),
    getReturnColumnsStr: jest.fn(),
    init: jest.fn(),
    prepareQuery: jest.fn(),
    stream: jest.fn(),
    serializeValue: jest.fn(),
    deSerializeValue: jest.fn(),
    table: jest.fn(),
    raw: jest.fn(),
    exec: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    close: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    lt: jest.fn(),
    gt: jest.fn(),
    lte: jest.fn(),
    gte: jest.fn(),
    like: jest.fn(),
    notLike: jest.fn(),
    between: jest.fn(),
    in: jest.fn(),
    notIn: jest.fn(),
    isNull: jest.fn(),
    isNotNull: jest.fn(),
    and: jest.fn(),
    or: jest.fn(),
    not: jest.fn(),
    exists: jest.fn(),
    notExists: jest.fn(),
    parse: jest.fn(),
    parseVirtual: jest.fn(),
    getTableName: jest.fn(),
    getTableAlias: jest.fn(),
    getFieldName: jest.fn(),
    getFieldAlias: jest.fn(),
    getParameterName: jest.fn(),
    quote: jest.fn(),
    quoteField: jest.fn(),
    quoteTable: jest.fn(),
    quoteParameter: jest.fn(),
    escapeLike: jest.fn(),
    join: jest.fn(),
    getUpdateReturnColumns: jest.fn(),
    getInsertReturnColumns: jest.fn(),
    getDeleteReturnColumns: jest.fn(),
    getDefaultSchema: jest.fn(),
    getTableSchema: jest.fn(),
    getQualifiedTableName: jest.fn(),
    executeQuery: jest.fn(),
    executeStatement: jest.fn(),
    executeStatements: jest.fn(),
    executeTransaction: jest.fn()
  };

  // Set up default mock implementations
  handler.run.mockImplementation(() => Promise.resolve(baseMockResult));
  handler.runStatement.mockImplementation(() => Promise.resolve(baseMockResult));
  handler.getConnection.mockImplementation(() => Promise.resolve({}));
  handler.init.mockImplementation(() => Promise.resolve());
  handler.commit.mockImplementation(() => Promise.resolve());
  handler.rollback.mockImplementation(() => Promise.resolve());
  handler.close.mockImplementation(() => Promise.resolve());

  return handler as unknown as Handler;
};

describe('Connection', () => {
  let handler: Handler;
  let connection: Connection;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = createMockHandler();
    connection = new Connection(handler);
  });

  describe('run', () => {
    it('should execute string query using handler', async () => {
      const query = 'SELECT * FROM users';
      const result = await connection.run(query);

      expect(handler.run).toHaveBeenCalledWith(query, undefined, undefined);
      expect(result).toEqual(baseMockResult);
    });

    it('should pass connection object if provided in constructor', async () => {
      const conn = { id: 'test-connection' };
      const connection = new Connection(handler, conn);
      const query = 'SELECT * FROM users';

      await connection.run(query);

      expect(handler.run).toHaveBeenCalledWith(query, undefined, conn);
    });
  });

  describe('runStatement', () => {
    it('should execute Statement object using handler', async () => {
      const statement = new Statement(types.Command.SELECT);
      const result = await connection.runStatement(statement);

      expect(handler.runStatement).toHaveBeenCalledWith(statement, undefined);
      expect(result).toEqual(baseMockResult);
    });

    it('should handle array of statements', async () => {
      const statements = [new Statement(types.Command.SELECT), new Statement(types.Command.INSERT)];
      const result = await connection.runStatement(statements);

      expect(handler.runStatement).toHaveBeenCalledWith(statements, undefined);
      expect(result).toEqual(baseMockResult);
    });

    it('should pass connection object when executing statements', async () => {
      const conn = { id: 'test-connection' };
      const connection = new Connection(handler, conn);
      const statement = new Statement(types.Command.SELECT);

      await connection.runStatement(statement);

      expect(handler.runStatement).toHaveBeenCalledWith(statement, conn);
    });
  });
});

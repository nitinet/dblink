import { beforeEach, describe, expect, jest, it } from '@jest/globals';
import LinkArray from '../LinkArray.js';
import Context from '../../Context.js';
import { IEntityType } from 'dblink-core/src/types.js';
import WhereExprBuilder from '../WhereExprBuilder.js';
import DBSet from '../../collection/DBSet.js';

class TestChildEntity {
  constructor(init?: Partial<TestChildEntity>) {
    if (init) {
      Object.assign(this, init);
    }
  }
  id = 0;
  parentId = 0;
  value = '';
}

class TestParentEntity {
  constructor(init?: Partial<TestParentEntity>) {
    if (init) {
      Object.assign(this, init);
    }
  }
  id = 0;
  name = '';
}

describe('LinkArray', () => {
  let mockContext: jest.Mocked<Context>;
  let mockLogger: { log: jest.Mock };
  const mockValue = new TestChildEntity({ id: 1, parentId: 1, value: 'test1' });
  let linkArray: LinkArray<TestChildEntity, TestParentEntity>;
  let whereBuilder: WhereExprBuilder<TestChildEntity>;

  beforeEach(() => {
    mockLogger = { log: jest.fn() };
    const mockFieldMap = new Map();
    mockFieldMap.set('id', { fieldName: 'id', colName: 'id', dataType: Number });
    mockFieldMap.set('parentId', { fieldName: 'parentId', colName: 'parentId', dataType: Number });

    whereBuilder = new WhereExprBuilder<TestChildEntity>(mockFieldMap);

    mockContext = {
      handler: {
        serializeValue: jest.fn(),
        init: jest.fn(),
        getConnection: jest.fn()
      },
      logger: mockLogger,
      connection: null,
      log: jest.fn(),
      init: jest.fn(),
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      close: jest.fn(),
      run: jest.fn(),
      runStatement: jest.fn(),
      dbSet: jest.fn(),
      tableSetMap: new Map(),
      stream: jest.fn(),
      getDbSet: jest.fn()
    } as unknown as jest.Mocked<Context>;

    linkArray = new LinkArray<TestChildEntity, TestParentEntity>(TestChildEntity as unknown as IEntityType<TestChildEntity>, (source, parent) => source.eq('parentId', parent.id));
  });

  it('should bind with context and populate value', async () => {
    const mockDbSet = {
      list: jest.fn<() => Promise<TestChildEntity[]>>().mockResolvedValueOnce([mockValue])
    };
    mockContext.tableSetMap.set(TestChildEntity as unknown as IEntityType<TestChildEntity>, { dbSet: mockDbSet } as any);

    const parent = new TestParentEntity({ id: 1, name: 'test' });
    linkArray.bind(mockContext, parent);

    const result = await linkArray.get();
    expect(result).toEqual([mockValue]);
    expect(mockDbSet.list).toHaveBeenCalled();
  });

  it('should handle empty result', async () => {
    const mockDbSet = {
      list: jest.fn<() => Promise<TestChildEntity[]>>().mockResolvedValueOnce([])
    };
    mockContext.tableSetMap.set(TestChildEntity as unknown as IEntityType<TestChildEntity>, { dbSet: mockDbSet } as any);

    const parent = new TestParentEntity({ id: 1, name: 'test' });
    linkArray.bind(mockContext, parent);

    const result = await linkArray.get();
    expect(result).toEqual([]);
    expect(mockDbSet.list).toHaveBeenCalled();
  });

  it('should throw error if not bound', async () => {
    await expect(linkArray.get()).rejects.toThrow('Entity Not Bonded');
  });

  it('should handle toJSON with no value', () => {
    expect(linkArray.toJSON()).toBeNull();
  });

  it('should handle toJSON with value', async () => {
    const mockDbSet = {
      list: jest.fn<() => Promise<TestChildEntity[]>>().mockResolvedValueOnce([mockValue])
    };
    mockContext.tableSetMap.set(TestChildEntity as unknown as IEntityType<TestChildEntity>, { dbSet: mockDbSet } as any);

    const parent = new TestParentEntity({ id: 1, name: 'test' });
    linkArray.bind(mockContext, parent);
    await linkArray.get();

    expect(linkArray.toJSON()).toEqual([mockValue]);
  });
});

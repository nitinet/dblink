import { beforeEach, describe, expect, jest, it } from '@jest/globals';
import { Handler } from 'dblink-core';
import { IEntityType } from 'dblink-core/src/types.js';
import Context from '../../Context.js';
import LinkObject from '../LinkObject.js';

class TestChildEntity {
  id = 0;
  parentId = 0;
  value = '';

  static new(...args: unknown[]): TestChildEntity {
    return new TestChildEntity(args[0] as Partial<TestChildEntity>);
  }

  constructor(init?: Partial<TestChildEntity>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}

class TestParentEntity {
  id = 0;
  name = '';

  static new(...args: unknown[]): TestParentEntity {
    return new TestParentEntity(args[0] as Partial<TestParentEntity>);
  }

  constructor(init?: Partial<TestParentEntity>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}

describe('LinkObject', () => {
  let mockHandler: jest.Mocked<Handler>;
  let mockLogger: { log: jest.Mock };
  let mockContext: jest.Mocked<Context>;
  const mockValue = new TestChildEntity({ id: 1, parentId: 1, value: 'test1' });

  beforeEach(() => {
    mockHandler = {
      run: jest.fn(),
      runStatement: jest.fn(),
      serializeValue: jest.fn(),
      close: jest.fn()
    } as unknown as jest.Mocked<Handler>;

    mockLogger = { log: jest.fn() };

    mockContext = {
      handler: mockHandler,
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

    // Add missing methods to mockContext
    (mockContext as any).getDbSet = jest.fn();
  });

  it('should bind with context and populate value', async () => {
    const mockDbSet = {
      first: jest.fn<() => Promise<TestChildEntity>>().mockResolvedValue(mockValue)
    };
    (mockContext as any).getDbSet.mockReturnValue(mockDbSet);

    const linkObj = new LinkObject<TestChildEntity, TestParentEntity>(TestChildEntity as unknown as IEntityType<TestChildEntity>, (source, parent) => source.eq('parentId', parent.id));

    const parent = new TestParentEntity({ id: 1, name: 'test' });
    linkObj.bind(mockContext, parent);

    const result = await mockDbSet.first();
    expect(result).toEqual(mockValue);
    expect((mockContext as any).getDbSet).toHaveBeenCalledWith(TestChildEntity);
    expect(mockDbSet.first).toHaveBeenCalled();
  });

  it('should handle null result', async () => {
    const mockDbSet = {
      first: jest.fn<() => Promise<TestChildEntity | null>>().mockResolvedValue(null)
    };
    (mockContext as any).getDbSet.mockReturnValue(mockDbSet);

    const linkObj = new LinkObject<TestChildEntity, TestParentEntity>(TestChildEntity as unknown as IEntityType<TestChildEntity>, (source, parent) => source.eq('parentId', parent.id));

    const parent = new TestParentEntity({ id: 1, name: 'test' });
    linkObj.bind(mockContext, parent);

    const result = await mockDbSet.first();
    expect(result).toBeNull();
    expect((mockContext as any).getDbSet).toHaveBeenCalledWith(TestChildEntity);
    expect(mockDbSet.first).toHaveBeenCalled();
  });
});

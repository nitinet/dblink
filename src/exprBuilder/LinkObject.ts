import { IEntityType } from 'dblink-core/src/types.js';
import Context from '../Context.js';
import LinkSet from '../collection/LinkSet.js';
import WhereExprBuilder from './WhereExprBuilder.js';
import * as types from './types.js';

/**
 * Link Object
 *
 * @class LinkObject
 * @typedef {LinkObject}
 * @template {Object} T
 * @template {Object} U
 */
class LinkObject<T extends object, U extends object> {
  /**
   * Entity Type
   *
   * @private
   * @type {types.IEntityType<T>}
   */
  private readonly EntityType: IEntityType<T>;

  /**
   * Foreign Function to bind
   *
   * @private
   * @type {types.IJoinFunc<WhereExprBuilder<T>, U>}
   */
  private readonly foreignFunc: types.IJoinFunc<WhereExprBuilder<T>, U>;

  /**
   * Link Set instance for performing queries
   *
   * @private
   * @type {(LinkSet<T, U> | null)}
   */
  private linkSet: LinkSet<T, U> | null = null;

  /**
   * Cached value of the linked object
   *
   * @private
   * @type {(T | null)}
   */
  private _value: T | null = null;

  /**
   * Creates an instance of LinkObject.
   *
   * @constructor
   * @param {IEntityType<T>} EntityType - The type of the linked entity
   * @param {types.IJoinFunc<WhereExprBuilder<T>, U>} foreignFunc - The function that defines the join relationship
   */
  constructor(EntityType: IEntityType<T>, foreignFunc: types.IJoinFunc<WhereExprBuilder<T>, U>) {
    this.EntityType = EntityType;
    this.foreignFunc = foreignFunc;
  }

  /**
   * Function to bind this link to a parent object
   * Sets up the relationship context for querying related entities
   *
   * @param {Context} context - The database context
   * @param {U} parentObj - The parent object this link belongs to
   */
  bind(context: Context, parentObj: U) {
    const tableSet = context.tableSetMap.get(this.EntityType);
    if (!tableSet) throw new TypeError('Invalid Type');

    this.linkSet = new LinkSet<T, U>(context, this.EntityType, tableSet.dbSet, this.foreignFunc);
    this.linkSet.apply(parentObj);
  }

  /**
   * Get the linked entity object
   * Retrieves the related entity and caches it
   *
   * @async
   * @returns {Promise<T | null>} - The linked entity or null if not found
   */
  async get(): Promise<T | null> {
    if (!this.linkSet) throw new TypeError('Entity Not Bonded');
    if (!this._value) this._value = await this.linkSet.single();
    return this._value;
  }

  /**
   * Convert to JSON representation
   * Used for serialization when the object is stringified
   *
   * @returns {Object | null} - JSON representation of the linked entity or null
   */
  toJSON(): object | null {
    return this._value?.valueOf() ?? null;
  }
}

export default LinkObject;

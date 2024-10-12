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
   * Link Set
   *
   * @private
   * @type {(LinkSet<T, U> | null)}
   */
  private linkSet: LinkSet<T, U> | null = null;

  /**
   * Linked Object Value
   *
   * @private
   * @type {(T | null)}
   */
  private _value: T | null = null;

  /**
   * Creates an instance of LinkObject.
   *
   * @constructor
   * @param {IEntityType<T>} EntityType
   * @param {types.IJoinFunc<WhereExprBuilder<T>, U>} foreignFunc
   */
  constructor(EntityType: IEntityType<T>, foreignFunc: types.IJoinFunc<WhereExprBuilder<T>, U>) {
    this.EntityType = EntityType;
    this.foreignFunc = foreignFunc;
  }

  /**
   * Function to bind this with parent object
   *
   * @param {Context} context
   * @param {U} parentObj
   */
  bind(context: Context, parentObj: U) {
    const tableSet = context.tableSetMap.get(this.EntityType);
    if (!tableSet) throw TypeError('Invalid Type');

    this.linkSet = new LinkSet<T, U>(context, this.EntityType, tableSet.dbSet, this.foreignFunc);
    this.linkSet.apply(parentObj);
  }

  /**
   * Get linked value
   *
   * @async
   * @returns {Promise<T | null>}
   */
  async get(): Promise<T | null> {
    if (!this.linkSet) throw new TypeError('Entity Not Bonded');
    if (!this._value) this._value = await this.linkSet.single();
    return this._value;
  }

  /**
   * JSON value
   *
   * @returns {Object | null}
   */
  toJSON(): object | null {
    return this._value?.valueOf() ?? null;
  }
}

export default LinkObject;

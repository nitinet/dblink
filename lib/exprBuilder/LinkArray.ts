import Context from '../Context.js';
import LinkSet from '../collection/LinkSet.js';
import WhereExprBuilder from './WhereExprBuilder.js';
import * as types from './types.js';

/**
 * LinkArray
 *
 * @class LinkArray
 * @typedef {LinkArray}
 * @template {Object} T
 * @template {Object} U
 */
class LinkArray<T extends Object, U extends Object> {
  /**
   * Entity Type
   *
   * @private
   * @type {types.IEntityType<T>}
   */
  private EntityType: types.IEntityType<T>;

  /**
   * Foreign Function to bind
   *
   * @private
   * @type {types.IJoinFunc<WhereExprBuilder<T>, U>}
   */
  private foreignFunc: types.IJoinFunc<WhereExprBuilder<T>, U>;

  /**
   * Link Set
   *
   * @private
   * @type {(LinkSet<T, U> | null)}
   */
  private linkSet: LinkSet<T, U> | null = null;

  /**
   * Linked Array Value
   *
   * @private
   * @type {(T[] | null)}
   */
  private _value: T[] | null = null;

  /**
   * Creates an instance of LinkArray.
   *
   * @constructor
   * @param {types.IEntityType<T>} EntityType
   * @param {types.IJoinFunc<WhereExprBuilder<T>, U>} foreignFunc
   */
  constructor(EntityType: types.IEntityType<T>, foreignFunc: types.IJoinFunc<WhereExprBuilder<T>, U>) {
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
    let tableSet = context.tableSetMap.get(this.EntityType);
    if (!tableSet) throw TypeError('Invalid Type');

    this.linkSet = new LinkSet<T, U>(context, this.EntityType, tableSet.dbSet, this.foreignFunc);
    this.linkSet.apply(parentObj);
  }

  /**
   * Get linked value
   *
   * @async
   * @returns {Promise<T[]>
   */
  async get(): Promise<T[]> {
    if (!this.linkSet) throw new TypeError('Entity Not Bonded');
    if (!this._value) this._value = await this.linkSet.list();
    return this._value;
  }

  /**
   * JSON value
   *
   * @returns {Object | null}
   */
  toJSON() {
    return this._value?.valueOf() ?? null;
  }
}

export default LinkArray;

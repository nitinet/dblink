import Context from '../Context.js';
import WhereExprBuilder from '../exprBuilder/WhereExprBuilder.js';
import * as exprBuilder from '../exprBuilder/index.js';
import DBSet from './DBSet.js';
import QuerySet from './QuerySet.js';

/**
 * LinkSet
 *
 * @class LinkSet
 * @typedef {LinkSet}
 * @template {Object} T
 * @template {Object} U
 * @extends {QuerySet<T>}
 */
class LinkSet<T extends object, U extends object> extends QuerySet<T> {
  /**
   * Foreign Function to bind
   *
   * @private
   * @type {exprBuilder.types.IJoinFunc<WhereExprBuilder<T>, U>}
   */
  private foreignFunc: exprBuilder.types.IJoinFunc<WhereExprBuilder<T>, U>;

  /**
   * Creates an instance of LinkSet.
   *
   * @constructor
   * @param {Context} context
   * @param {exprBuilder.types.IEntityType<T>} entityType
   * @param {DBSet} dbSet
   * @param {exprBuilder.types.IJoinFunc<WhereExprBuilder<T>, U>} foreignFunc
   */
  constructor(context: Context, entityType: exprBuilder.types.IEntityType<T>, dbSet: DBSet, foreignFunc: exprBuilder.types.IJoinFunc<WhereExprBuilder<T>, U>) {
    super(context, entityType, dbSet);
    this.foreignFunc = foreignFunc;
  }

  /**
   * Apply foreign function to parent object
   *
   * @param {U} parentObj
   */
  apply(parentObj: U) {
    const eb = new exprBuilder.WhereExprBuilder<T>(this.dbSet.fieldMap);
    const expr = this.foreignFunc(eb, parentObj);

    if (expr && expr.exps.length > 0) {
      this.stat.where = this.stat.where.add(expr);
    }
  }
}

export default LinkSet;

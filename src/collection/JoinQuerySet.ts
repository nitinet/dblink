import * as sql from 'dblink-core/src/sql/index.js';
import { Readable } from 'stream';
import IQuerySet from './IQuerySet.js';

/**
 * JoinQuerySet
 *
 * @class JoinQuerySet
 * @typedef {JoinQuerySet}
 * @template {Object} T
 * @template {Object} U
 * @extends {IQuerySet<T & U>}
 */
class JoinQuerySet<T extends object, U extends object> extends IQuerySet<T & U> {
  /**
   * Main QuerySet
   *
   * @private
   * @type {IQuerySet<T>}
   */
  private mainSet: IQuerySet<T>;
  /**
   * Join QuerySet
   *
   * @private
   * @type {IQuerySet<U>}
   */
  private joinSet: IQuerySet<U>;

  /**
   * Statement
   *
   * @type {sql.Statement}
   */
  stat: sql.Statement;

  /**
   * Creates an instance of JoinQuerySet.
   *
   * @constructor
   * @param {IQuerySet<T>} mainSet
   * @param {IQuerySet<U>} joinSet
   * @param {sql.types.Join} joinType
   * @param {sql.Expression} expr
   */
  constructor(mainSet: IQuerySet<T>, joinSet: IQuerySet<U>, joinType: sql.types.Join, expr: sql.Expression) {
    super();
    this.mainSet = mainSet;
    this.context = mainSet.context;

    this.joinSet = joinSet;

    this.stat = new sql.Statement(sql.types.Command.SELECT);

    // this.stat.collection.leftColl = this.mainSet.stat.collection;
    // this.stat.collection.rightColl = this.joinSet.stat.collection;
    this.stat.collection.join = joinType;

    this.stat.where = this.stat.where.add(expr);
  }

  // getEntity(): T & U {
  // 	let mainObj = this.mainSet.getEntity();
  // 	let joinObj = this.joinSet.getEntity();
  // 	return Object.assign(mainObj, joinObj);
  // 	// return null;
  // }

  /**
   * Get total count of entity objects
   *
   * @returns {Promise<number>}
   */
  count(): Promise<number> {
    throw new Error('Method not implemented.');
  }

  // Selection Functions
  /**
   * Get entity object list
   *
   * @async
   * @returns {Promise<Array<T & U>>}
   */
  async list(): Promise<Array<T & U>> {
    // this.stat.command = sql.types.Command.SELECT;

    // let tempObj = this.getEntity();
    // this.setStatColumns(tempObj);

    // let result = await this.context.execute(this.stat);
    // return this.mapData(result);
    //TODO: implementation
    return [];
  }

  /**
   * Get entity objects list and total count
   *
   * @returns {Promise<{ count: number; values: (T & U)[] }>}
   */
  listAndCount(): Promise<{ count: number; values: (T & U)[] }> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get stream of Entity objects
   *
   * @returns {Promise<Readable>}
   */
  stream(): Promise<Readable> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get plain object list
   *
   * @param {(keyof T | keyof U)[]} keys
   * @returns {Promise<Partial<T & U>[]>}
   */
  listPlain(): Promise<Partial<T & U>[]> {
    // keys: (keyof T | keyof U)[]

    throw new Error('Method not implemented.');
  }

  /**
   * Get plain object list and total count
   *
   * @param {(keyof T | keyof U)[]} keys
   * @returns {Promise<{ count: number; values: Partial<T & U>[] }>}
   */
  listPlainAndCount(): Promise<{ count: number; values: Partial<T & U>[] }> {
    // keys: (keyof T | keyof U)[]

    throw new Error('Method not implemented.');
  }

  /**
   * Map result set data to Entity objects
   *
   * @async
   * @param {ResultSet} input
   * @returns {Promise<Array<T & U>>}
   */
  async mapData(): Promise<Array<T & U>> {
    // input: ResultSet

    // let resMain = await this.mainSet.mapData(input);
    // let resJoin = await this.joinSet.mapData(input);

    // let res = new Array<T & U>();
    // for (let i = 0; i < input.rowCount; i++) {
    // 	let objMain = resMain[i];
    // 	let objJoin = resJoin[i];
    // 	let objFinal = Object.assign(objMain, objJoin);
    // 	res.push(objFinal);
    // }
    // return res;
    //TODO: implement
    return [];
  }

  // select<V extends Object = types.SubEntityType<T & U>>(TargetType: types.IEntityType<V>): IQuerySet<V> {

  /**
   * Get Queryable Select object with custom Type
   *
   * @template {Object} V
   * @param {exprBuilder.types.IEntityType<V>} EntityType
   * @returns {IQuerySet<V>}
   */
  select<V extends object>(): IQuerySet<V> {
    // EntityType: exprBuilder.types.IEntityType<V>

    // this.stat.command = sql.types.Command.SELECT;

    // let a = this.getEntity();
    // let tempObj = TargetType(a);
    // this.setStatColumns(tempObj);

    // let result = await this.context.execute(this.stat);
    // let temps = await this.mapData(result);
    // let res: V[] = [];
    // temps.forEach(t => {
    // 	let r = TargetType(t);
    // 	res.push(r);
    // });

    // return res;
    //TODO: implement
    throw new Error('Method not implemented.');
  }

  // Conditional Functions
  /**
   * Function to generate Where clause
   *
   * @param {exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T & U>>} param
   * @param {...any[]} args
   * @returns {IQuerySet<T & U>}
   */
  where(): IQuerySet<T & U> {
    // param: exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T & U>>,
    // ...args: unknown[]

    // let res = null;
    // if (param && param instanceof Function) {
    // 	//TODO: fix join fieldMap
    // 	let mainFieldMap = this.context.tableSetMap.get(null).fieldMap;
    // 	let joinFieldMap = this.context.tableSetMap.get(null).fieldMap;
    // 	let finalFieldMap = new Map([...mainFieldMap, ...joinFieldMap]);

    // 	let op = new model.WhereExprBuilder<T & U>(finalFieldMap);
    // 	res = param(op, args);
    // }
    // if (res && res instanceof sql.Expression && res.exps.length > 0) {
    // 	this.stat.where = this.stat.where.add(res);
    // }
    return this;
  }

  /**
   * Function to generate Group By clause
   *
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T & U>>} param
   * @returns {IQuerySet<T & U>}
   */
  groupBy(): IQuerySet<T & U> {
    // param: exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T & U>>

    // let res = null;
    // if (param && param instanceof Function) {
    // 	//TODO: fix join fieldMap
    // 	let mainFieldMap = this.context.tableSetMap.get(Object)?.fieldMap;
    // 	let joinFieldMap = this.context.tableSetMap.get(Object)?.fieldMap;
    // 	let finalFieldMap = new Map([...mainFieldMap, ...joinFieldMap]);

    // 	let op = new model.GroupExprBuilder<T & U>(finalFieldMap);
    // 	res = param(op);
    // }
    // if (res && Array.isArray(res)) {
    // 	res.forEach(a => {
    // 		if (a instanceof sql.Expression && a.exps.length > 0) {
    // 			this.stat.groupBy.push(a);
    // 		}
    // 	});
    // }
    return this;
  }

  /**
   * Function to generate Order By clause
   *
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T & U>>} param
   * @returns {IQuerySet<T & U>}
   */
  orderBy(): IQuerySet<T & U> {
    // param: exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T & U>>

    // let res = null;
    // if (param && param instanceof Function) {
    // 	//TODO: fix join fieldMap
    // 	let mainFieldMap = this.context.tableSetMap.get(null)?.fieldMap;
    // 	let joinFieldMap = this.context.tableSetMap.get(null)?.fieldMap;
    // 	let finalFieldMap = new Map([...mainFieldMap, ...joinFieldMap]);

    // 	let op = new model.OrderExprBuilder<T & U>(finalFieldMap);
    // 	res = param(op);
    // }
    // if (res && Array.isArray(res)) {
    // 	res.forEach(expr => {
    // 		if (expr instanceof sql.Expression && expr.exps.length > 0) {
    // 			this.stat.orderBy.push(expr);
    // 		}
    // 	});
    // }
    return this;
  }

  /**
   * Function to generate Limit clause
   *
   * @param {number} size
   * @param {?number} [index]
   * @returns {IQuerySet<T & U>}
   */
  limit(size: number, index?: number): IQuerySet<T & U> {
    this.stat.limit = new sql.Expression(null, sql.types.Operator.Limit);
    this.stat.limit.exps.push(new sql.Expression(size.toString()));
    if (index) {
      this.stat.limit.exps.push(new sql.Expression(index.toString()));
    }
    return this;
  }

  // join<A extends Object>(coll: IQuerySet<A>, param: types.IJoinFunc<model.WhereExprBuilder<T & U>, model.GroupExprBuilder<A>>, joinType?: sql.types.Join): IQuerySet<T & U & A> {
  // 	joinType = joinType || sql.types.Join.InnerJoin;

  // 	let temp: sql.Expression | null = null;
  // 	if (param && param instanceof Function) {
  // 		let mainObj = this.getEntity(); new model.WhereExprBuilder<T>(this.dbSet.fieldMap);
  // 		let joinObj = coll.getEntity();
  // 		temp = param(mainObj, joinObj);
  // 	}
  // 	let res: JoinQuerySet<T & U, A>;
  // 	if (temp instanceof sql.Expression && temp.exps.length > 0) {
  // 		res = new JoinQuerySet<T & U, A>(this, coll, joinType, temp);
  // 	} else {
  // 		throw new TypeError('Invalid Join');
  // 	}
  // 	return res;
  // }
}

export default JoinQuerySet;

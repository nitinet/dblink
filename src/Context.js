import { cloneDeep } from 'lodash-es';
import TableSet from './collection/TableSet.js';
import Connection from './model/Connection.js';
export default class Context {
  handler;
  connection = null;
  logger;
  tableSetMap = new Map();
  constructor(handler, optns) {
    this.handler = handler;
    this.logger = optns?.logger || console;
  }
  log(...arg) {
    this.logger.log(...arg);
  }
  async init() {
    await this.handler.init();
    Reflect.ownKeys(this).forEach(key => {
      const tableSet = Reflect.get(this, key);
      if (!(tableSet instanceof TableSet)) return;
      tableSet.context = this;
      this.tableSetMap.set(tableSet.getEntityType(), tableSet);
    });
  }
  async run(query) {
    const conn = this.connection ?? this.handler;
    return conn.run(query);
  }
  async runStatement(stmt) {
    const conn = this.connection ?? this.handler;
    return conn.runStatement(stmt);
  }
  async stream(query) {
    const conn = this.connection ?? this.handler;
    return await conn.stream(query);
  }
  async streamStatement(query) {
    const conn = this.connection ?? this.handler;
    return await conn.streamStatement(query);
  }
  async initTransaction() {
    const res = cloneDeep(this);
    const keys = Reflect.ownKeys(res);
    keys.forEach(key => {
      const prop = Reflect.get(res, key);
      if (prop instanceof TableSet) {
        prop.context = res;
      }
    });
    const nativeConn = await this.handler.getConnection();
    res.connection = new Connection(res.handler, nativeConn);
    await res.connection.initTransaction();
    return res;
  }
  async commit() {
    if (!this.connection) throw new TypeError('Transaction Not Started');
    await this.connection.commit();
    await this.connection.close();
  }
  async rollback() {
    if (!this.connection) throw new TypeError('Transaction Not Started');
    await this.connection.rollback();
    await this.connection.close();
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUV0QyxPQUFPLFFBQVEsTUFBTSwwQkFBMEIsQ0FBQztBQUNoRCxPQUFPLFVBQVUsTUFBTSx1QkFBdUIsQ0FBQztBQVMvQyxNQUFNLENBQUMsT0FBTyxPQUFPLE9BQU87SUFPakIsT0FBTyxDQUFXO0lBUW5CLFVBQVUsR0FBc0IsSUFBSSxDQUFDO0lBUTVCLE1BQU0sQ0FBd0M7SUFReEQsV0FBVyxHQUErQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBUzNFLFlBQVksT0FBZ0IsRUFBRSxLQUF5RDtRQUNyRixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssRUFBRSxNQUFNLElBQUksT0FBTyxDQUFDO0lBQ3pDLENBQUM7SUFPRCxHQUFHLENBQUMsR0FBRyxHQUFjO1FBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQVFELEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTFCLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2xDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxDQUFDLFFBQVEsWUFBWSxRQUFRLENBQUM7Z0JBQUUsT0FBTztZQUU1QyxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLEVBQUUs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

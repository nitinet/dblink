export default class Connection {
  handler;
  conn = null;
  constructor(handler, conn) {
    this.handler = handler;
    this.conn = conn;
  }
  async run(query) {
    return this.handler.run(query, undefined, this.conn);
  }
  runStatement(query) {
    return this.handler.runStatement(query, this.conn);
  }
  stream(query) {
    return this.handler.stream(query, undefined, this.conn);
  }
  streamStatement(query) {
    return this.handler.streamStatement(query, this.conn);
  }
  async initTransaction() {
    await this.handler.initTransaction(this.conn);
  }
  async commit() {
    await this.handler.commit(this.conn);
  }
  async rollback() {
    await this.handler.rollback(this.conn);
  }
  async close() {
    await this.handler.close(this.conn);
    this.conn = null;
  }
}
//# sourceMappingURL=Connection.js.map

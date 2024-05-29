import { cloneDeep } from 'lodash-es';
import TableSet from './collection/TableSet.js';
import Connection from './model/Connection.js';
export default class Context {
    _handler;
    connection = null;
    logger;
    tableSetMap = new Map();
    constructor(handler, optns) {
        this._handler = handler;
        this.logger = optns?.logger || console;
    }
    log(...arg) {
        this.logger.log(...arg);
    }
    async init() {
        await this._handler.init();
        Reflect.ownKeys(this).forEach(key => {
            const tableSet = Reflect.get(this, key);
            if (!(tableSet instanceof TableSet))
                return;
            tableSet.context = this;
            this.tableSetMap.set(tableSet.getEntityType(), tableSet);
        });
    }
    async run(query) {
        const conn = this.connection ?? this._handler;
        return conn.run(query);
    }
    async executeStatement(stmt) {
        const conn = this.connection ?? this._handler;
        return conn.runStatement(stmt);
    }
    async stream(query) {
        const conn = this.connection ?? this._handler;
        return await conn.stream(query);
    }
    async streamStatement(query) {
        const conn = this.connection ?? this._handler;
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
        const nativeConn = await this._handler.getConnection();
        res.connection = new Connection(res._handler, nativeConn);
        await res.connection.initTransaction();
        return res;
    }
    async commit() {
        if (!this.connection)
            throw new TypeError('Transaction Not Started');
        await this.connection.commit();
        await this.connection.close();
    }
    async rollback() {
        if (!this.connection)
            throw new TypeError('Transaction Not Started');
        await this.connection.rollback();
        await this.connection.close();
    }
}
//# sourceMappingURL=Context.js.map
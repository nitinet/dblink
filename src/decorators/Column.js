import { COLUMN_KEY, TABLE_COLUMN_KEYS } from './Constants.js';
function Column(name) {
    return function (target, property) {
        const val = name ?? property;
        let columnVals = Reflect.getMetadata(TABLE_COLUMN_KEYS, target);
        if (!columnVals)
            columnVals = [];
        columnVals.push(property);
        Reflect.defineMetadata(TABLE_COLUMN_KEYS, columnVals, target);
        Reflect.defineMetadata(COLUMN_KEY, val, target, property);
    };
}
export default Column;
//# sourceMappingURL=Column.js.map
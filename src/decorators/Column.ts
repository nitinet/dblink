import { COLUMN_KEY, TABLE_COLUMN_KEYS } from './Constants.js';

/**
 * Column Decorator
 *
 * @param {?string} [name]
 * @returns {(target: object, property: string) => void}
 */
function Column(name?: string): (target: object, property: string) => void {
  return function (target: object, property: string) {
    const val = name ?? property;

    let columnVals: string[] | null = Reflect.getMetadata(TABLE_COLUMN_KEYS, target);
    if (!columnVals) columnVals = [];
    columnVals.push(property);
    Reflect.defineMetadata(TABLE_COLUMN_KEYS, columnVals, target);

    Reflect.defineMetadata(COLUMN_KEY, val, target, property);
  };
}

export default Column;

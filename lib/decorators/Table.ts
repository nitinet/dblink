import { TABLE_KEY } from './Constants.js';

/**
 * Table Decorator
 *
 * @param {?string} [name]
 * @returns {(target: any) => void}
 */
function Table(name?: string): (target: any) => void {
  return function (target: any) {
    let val = name ?? target.name;
    return Reflect.defineMetadata(TABLE_KEY, val, target);
  };
}

export default Table;

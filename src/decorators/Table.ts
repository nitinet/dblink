import { TABLE_KEY } from './Constants.js';

/**
 * Table Decorator
 *
 * @param {?string} [name]
 * @returns {(target: { name: string }) => void}
 */
function Table(name?: string): (target: { name: string }) => void {
  return function (target: { name: string }) {
    const val = name ?? target.name;
    return Reflect.defineMetadata(TABLE_KEY, val, target);
  };
}

export default Table;

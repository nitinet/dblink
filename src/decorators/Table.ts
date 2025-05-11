import { TABLE_KEY } from './Constants.js';

/**
 * Table Decorator
 * Marks a class as a database table entity and allows specifying a custom table name
 *
 * @param {?string} [name] - Optional custom table name (defaults to class name if not provided)
 * @returns {(target: { name: string }) => void} - Decorator function
 */
function Table(name?: string): (target: { name: string }) => void {
  return function (target: { name: string }) {
    const val = name ?? target.name;
    return Reflect.defineMetadata(TABLE_KEY, val, target);
  };
}

export default Table;

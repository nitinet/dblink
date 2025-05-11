import { ID_KEY } from './Constants.js';

/**
 * Id Decorator
 * Marks a property as a primary key for a database entity
 * When applied to a property, it designates that property as part of the table's primary key
 *
 * @type {{(target: () => void): void; (target: Object, propertyKey: string | symbol): void;}}
 */
const Id: {
  (target: () => void): void;
  (target: object, propertyKey: string | symbol): void;
} = Reflect.metadata(ID_KEY, true);

export default Id;

import { ID_KEY } from './Constants.js';

/**
 * Id Decorator
 *
 * @type {{(target: () => void): void; (target: Object, propertyKey: string | symbol): void;}}
 */
const Id: {
  (target: () => void): void;
  (target: object, propertyKey: string | symbol): void;
} = Reflect.metadata(ID_KEY, true);

export default Id;

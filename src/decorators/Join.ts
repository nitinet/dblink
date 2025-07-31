import { IEntityType } from 'dblink-core/src/types.js';
import { types } from '../exprBuilder/index.js';
import WhereExprBuilder from '../exprBuilder/WhereExprBuilder.js';
import { JOIN_KEY } from './Constants.js';

/**
 * Join Decorator Factory
 *
 * @template T
 * @template U
 * @param {IEntityType<U>} EntityType - The entity type to join with
 * @param {types.IForeignFunc<WhereExprBuilder<T>, U>} joinFunc - Function defining the join condition
 * @returns {(target: Object, propertyKey: string | symbol) => void}
 */
function Join<T extends object, U extends object>(EntityType: IEntityType<U>, joinFunc: types.IForeignFunc<WhereExprBuilder<T>, U>): (target: object, propertyKey: string | symbol) => void {
  return function (target: object, propertyKey: string | symbol): void {
    const joinMeta = {
      EntityType,
      joinFunc
    };

    Reflect.defineMetadata(JOIN_KEY, joinMeta, target, propertyKey);
  };
}

export default Join;

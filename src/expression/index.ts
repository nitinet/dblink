import Expression from 'dblink-core/src/sql/Expression.js';
import { Operator } from 'dblink-core/src/sql/types/index.js';

export function array(...args: unknown[]): Expression {
  const vals = args.map(val => {
    const arg = new Expression('?');
    arg.args = arg.args.concat(val);
    return arg;
  });
  return new Expression(null, Operator.Array, ...vals);
}

export function cast(expr: Expression, val2: string): Expression {
  const cast = new Expression(val2);
  return new Expression(null, Operator.Cast, expr, cast);
}

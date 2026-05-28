export class GraphQLParseError extends Error {
  position;
  constructor(message, position = 0) {
    super(`GraphQL Parse Error at position ${position}: ${message}`);
    this.name = 'GraphQLParseError';
    this.position = position;
  }
}
export class GraphQLIntrospectionError extends Error {
  constructor(message) {
    super(`GraphQL Introspection Error: ${message}`);
    this.name = 'GraphQLIntrospectionError';
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEySkEsTUFBTSxPQUFPLGlCQUFrQixTQUFRLEtBQUs7SUFDakMsUUFBUSxDQUFTO0lBRTFCLFlBQVksT0FBZSxFQUFFLFFBQVEsR0FBRyxDQUFDO1FBQ3ZDLEtBQUssQ0FBQyxtQ0FBbUMsUUFBUSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBbUIsQ0FBQztRQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUMzQixDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8seUJBQTBCLFNBQVEsS0FBSztJQUNsRCxZQUFZLE9BQWU7UUFDekIsS0FBSyxDQUFDLGdDQUFnQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxJQUFJLEdBQUcsMkJBQTJCLENBQUM7SUFDMUMsQ0FBQztDQUNGIn0=

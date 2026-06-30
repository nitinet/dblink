# Database Checklist

- Entity decorators are complete (`@Table`, `@Column`, `@Id`, `@Foreign` as needed).
- Field names map correctly to database columns.
- Query filters/order/group use valid mapped fields.
- Updates exclude immutable/primary fields when appropriate.
- Transactions used for multi-step writes.
- Integration tests run against real DB for changed SQL behavior.

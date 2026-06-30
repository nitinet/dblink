# Security Checklist

- No unsafe SQL string concatenation introduced in core paths.
- Value operands remain parameterized expressions.
- No secrets committed in source.
- Transaction connection lifecycle closes resources.
- Error messages do not expose sensitive runtime internals in consumer-facing layers.
- Dependency updates reviewed for advisories.

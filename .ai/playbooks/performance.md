# Performance Playbook

1. Define measurable performance objective.
2. Benchmark current behavior on representative queries.
3. Apply low-risk optimizations:
   - narrow projections with `select`
   - pagination with `limit`
   - streams for large datasets
   - reduce unnecessary include/join expansion
4. Validate correctness remains unchanged.
5. Add performance regression checks where possible.
6. Document trade-offs and known constraints.

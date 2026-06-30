# Optimize Query Prompt Template

## Baseline

Document current query pattern and measured performance.

## Optimization goals

- Reduce latency
- Reduce memory
- Reduce DB load

## Candidate changes

- `select` projection narrowing
- `limit`/pagination
- `stream` for large result sets
- Join/include adjustments

## Validation

- Compare before/after metrics
- Verify functional equivalence

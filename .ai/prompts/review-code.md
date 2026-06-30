# Review Code Prompt Template

## Review objective

Assess correctness, regressions, security, and maintainability.

## Inputs

- Diff summary
- Changed files
- Test results

## Required output format

1. Findings by severity (critical/high/medium/low)
2. Risk assessment
3. Missing tests
4. Suggested fixes

## Focus areas for this repo

- Decorator metadata integrity
- Query AST correctness
- Transaction lifecycle safety
- API export stability

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    setupFiles: ['reflect-metadata'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Tests import the compiled .js (NodeNext), so v8 instruments the .js and
      // remaps back to .ts via inline source maps. The include filter matches the
      // executed .js; the report is attributed to the .ts source.
      include: ['src/**/*.js'],
      exclude: ['src/**/index.js'],
      // Lines and functions are fully covered; branch/statement gaps are
      // unreachable defensive guards (e.g. empty table-alias fallbacks). Gate on
      // the metrics we hold at 100% so a real regression fails CI.
      thresholds: {
        lines: 100,
        functions: 100
      }
    }
  }
});

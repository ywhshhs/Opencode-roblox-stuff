/**
 * Bug regression test for isImageLine() crash scenario
 *
 * Bug: When isImageLine() used startsWith() and terminal doesn't support images,
 * it would return false for lines containing image escape sequences, causing TUI to
 * crash with "Rendered line exceeds terminal width" error.
 *
 * Fix: Changed to use includes() to detect escape sequences anywhere in the line.
 *
 * This test demonstrates:
 * 1. The bug scenario with the old implementation
 * 2. That the fix works correctly
 */
export {};
//# sourceMappingURL=bug-regression-isimageline-startswith-bug.test.d.ts.map
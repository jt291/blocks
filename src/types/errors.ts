/**
 * Error Types for Blocks Language
 *
 * Based on specification: docs/SPECIFICATION.md
 */

import type { Location, Node } from "./ast";

// ============================================================================
// Parse Error
// ============================================================================

/**
 * Error during parsing
 */
export interface ParseError extends Error {
  /** Error type discriminator */
  type: "ParseError";
  /** Error message */
  message: string;
  /** Location in source */
  loc: Location;
  /** Source code fragment */
  source?: string;
}

/**
 * Create a ParseError
 */
export function createParseError(
  message: string,
  loc: Location,
  source?: string,
): ParseError {
  const error = new Error(message) as ParseError;
  error.type = "ParseError";
  error.loc = loc;
  error.source = source;
  return error;
}

// ============================================================================
// Runtime Error
// ============================================================================

/**
 * Error during interpretation/execution
 */
export interface RuntimeError extends Error {
  /** Error type discriminator */
  type: "RuntimeError";
  /** Error message */
  message: string;
  /** AST node where error occurred */
  node: Node;
  /** Stack trace */
  stack?: string;
}

/**
 * Create a RuntimeError
 */
export function createRuntimeError(
  message: string,
  node: Node,
  stack?: string,
): RuntimeError {
  const error = new Error(message) as RuntimeError;
  error.type = "RuntimeError";
  error.node = node;
  if (stack) {
    error.stack = stack;
  }
  return error;
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format a ParseError for display
 */
export function formatParseError(error: ParseError): string {
  const { message, loc, source } = error;
  const { start } = loc;

  let output = `ParseError: ${message}\n`;
  output += `  at ${start.path}:${start.line}:${start.column}\n`;

  if (source) {
    const lines = source.split("\n");
    const errorLine = lines[start.line - 1];

    output += `\n`;
    output += `  ${start.line - 1} | ${lines[start.line - 2] || ""}\n`;
    output += `  ${start.line} | ${errorLine}\n`;
    output += `  ${" ".repeat(String(start.line).length)} | ${" ".repeat(start.column - 1)}^\n`;

    if (lines[start.line]) {
      output += `  ${start.line + 1} | ${lines[start.line]}\n`;
    }
  }

  return output;
}

/**
 * Format a RuntimeError for display
 */
export function formatRuntimeError(error: RuntimeError): string {
  const { message, node, stack } = error;

  let output = `RuntimeError: ${message}\n`;

  if (node.loc) {
    const { start } = node.loc;
    output += `  at ${start.path}:${start.line}:${start.column}\n`;
  }

  output += `  in ${node.type} node\n`;

  if (stack) {
    output += `\nStack trace:\n${stack}`;
  }

  return output;
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Check if error is a ParseError
 */
export function isParseError(error: unknown): error is ParseError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as ParseError).type === "ParseError"
  );
}

/**
 * Check if error is a RuntimeError
 */
export function isRuntimeError(error: unknown): error is RuntimeError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as RuntimeError).type === "RuntimeError"
  );
}

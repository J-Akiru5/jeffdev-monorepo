import { describe, it, expect } from 'vitest';

/**
 * Sample Unit Test - Slug Generator
 * ----------------------------------
 * Demonstrates testing pattern for utility functions.
 * This tests a simple slug generation function.
 */

// Simple slug generator (would normally be imported from a utils file)
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

describe('generateSlug', () => {
  it('converts title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateSlug("Project #1: Special's!")).toBe('project-1-special-s');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('Too   Many   Spaces')).toBe('too-many-spaces');
  });

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  Leading and Trailing  ')).toBe('leading-and-trailing');
  });

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('');
  });
});

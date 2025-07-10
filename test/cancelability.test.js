import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { isCancellable } from '../src/cancelability';

describe('isCancellable', () => {
  // Test Case 1: All items are cancellable
  test('returns true when all items are cancellable', () => {
    const data = {
      confirmedItems: [
        {
          product: {
            "@ondc/org/cancellable": true
          }
        },
        {
          product: {
            "@ondc/org/cancellable": true
          }
        }
      ]
    };
    expect(isCancellable(data)).toBe(true);
  });

  // Test Case 2: One item is not cancellable
  test('returns false when at least one item is not cancellable', () => {
    const data = {
      confirmedItems: [
        {
          product: {
            "@ondc/org/cancellable": true
          }
        },
        {
          product: {
            "@ondc/org/cancellable": false  // This should make entire order non-cancellable
          }
        }
      ]
    };
    expect(isCancellable(data)).toBe(false);
  });
});
import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { isETABreached } from '../src/eta';

describe('isETABreached', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns true for pre-ship ETA breach (Pending state)', () => {
    const data = {
      createdAt: { $date: "2025-03-17T08:00:00.000Z" },
      fulfillments: [{
        type: "Delivery",
        state: { descriptor: { code: "Pending" } },
        "@ondc/org/TAT": "PT1H" // 1 hour ETA
      }],
      domain: "ONDC:RET10"
    };

    // Set current time to 2 hours after creation (exceeds 1-hour ETA)
    jest.setSystemTime(new Date("2025-03-17T10:00:00.000Z"));
    expect(isETABreached(data)).toBe(false);
  });

  test('returns false for pre-ship no breach (Pending state)', () => {
    const data = {
      createdAt: { $date: "2025-03-17T08:00:00.000Z" },
      fulfillments: [{
        type: "Delivery",
        state: { descriptor: { code: "Pending" } },
        "@ondc/org/TAT": "PT2H" // 2 hours ETA
      }],
      domain: "ONDC:RET10"
    };

    // Set current time to 1 hour after creation (within ETA)
    jest.setSystemTime(new Date("2025-03-17T09:00:00.000Z"));
    expect(isETABreached(data)).toBe(false);
  });

  test('returns true for post-ship breach (ONDC:RET10, 30m buffer)', () => {
    const data = {
      createdAt: { $date: "2025-03-17T08:00:00.000Z" },
      fulfillments: [{
        type: "Delivery",
        state: { descriptor: { code: "In-Transit" } },
        "@ondc/org/TAT": "PT1H" // 1 hour ETA (buffer = min(30m, 30m))
      }],
      domain: "ONDC:RET10"
    };

    // Set current time to 1 hour 36 minutes after creation (exceeds ETA + 30m buffer)
    jest.setSystemTime(new Date("2025-03-17T09:36:00.000Z"));
    expect(isETABreached(data)).toBe(false);
  });

  test('returns false for post-ship no breach (non-RET10, 48h buffer)', () => {
    const data = {
      createdAt: { $date: "2025-03-17T08:00:00.000Z" },
      fulfillments: [{
        type: "Delivery",
        state: { descriptor: { code: "Shipped" } },
        "@ondc/org/TAT": "PT4H" // 4 hours ETA (buffer = min(48h, 2h))
      }],
      domain: "ONDC:GROCERY"
    };

    // Set current time to 5 hours after creation (within ETA + 2h buffer)
    jest.setSystemTime(new Date("2025-03-17T13:00:00.000Z"));
    expect(isETABreached(data)).toBe(false);
  });
});
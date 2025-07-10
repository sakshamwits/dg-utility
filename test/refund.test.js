import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { calculateRefundAmount } from '../src/refund';

describe("calculateRefundAmount", () => {
  const baseProtocolResponse = {
    message: {
      order: {
        fulfillments: [
          {
            id: "fl1",
            type: "Item",
            tags: [
              {
                code: "quote_trail",
                list: [
                  {
                    code: "value",
                    value: "-100.00",
                  },
                ],
              },
            ],
          },
          {
            id: "fl2",
            type: "Item",
            tags: [
              {
                code: "quote_trail",
                list: [
                  {
                    code: "value",
                    value: "-50.00",
                  },
                ],
              },
            ],
          },
          {
            id: "del1",
            type: "Delivery",
            tags: [],
          },
        ],
      },
    },
  };

  const baseTransaction = {
    amount: "200.00",
  };

  const baseCharge = {
    quote: {
      platformFees: "10.00",
      taxes: {
        platformFeesTax: "1.80",
      },
    },
  };

  const createTestVariant = (overrides = {}) => ({
    protocolCancelResponse: {
      ...baseProtocolResponse,
      ...overrides.protocolCancelResponse,
    },
    transaction: { ...baseTransaction, ...overrides.transaction },
    refundedFl: overrides.refundedFl || [],
    charge: { ...baseCharge, ...overrides.charge },
  });

  test("should calculate refund for multiple fulfillments", async () => {
    const result = await calculateRefundAmount(
      baseProtocolResponse,
      { amount: "300.00" },
      [],
      baseCharge
    );

    expect(result.totalRefundedAmount).toBe(150);
    expect(result.refundAmount).toBe(50);
  });

  test("should handle partial refunds when transaction amount is less than fulfillment total", async () => {
    const result = await calculateRefundAmount(
      baseProtocolResponse,
      { amount: "120.00" },
      [],
      baseCharge
    );

    expect(result.totalRefundedAmount).toBe(120);
    expect(result.refundAmount).toBe(20);
  });

  test("should handle already partially refunded fulfillments", async () => {
    const result = await calculateRefundAmount(
      baseProtocolResponse,
      baseTransaction,
      [
        {
          flId: "fl1",
          amount: 50,
        },
      ],
      baseCharge
    );

    expect(result.totalRefundedAmount).toBe(100);
    expect(result.refundAmount).toBe(50);
  });

  test("should include platform fees when difference matches", async () => {
    const testData = createTestVariant({
      transaction: { amount: "161.80" },
      refundedFl: [
        {
          flId: "fl1",
          amount: 100,
        },
      ],
    });

    const result = await calculateRefundAmount(
      testData.protocolCancelResponse,
      testData.transaction,
      testData.refundedFl,
      testData.charge
    );

    expect(result).toEqual({
      refundPlatformFees: true,
      cancelCoupon: true,
      totalRefundedAmount: 161.8,
      refundAmount: 61.8,
    });
  });

  test("should handle empty fulfillments", async () => {
    const testData = createTestVariant({
      protocolCancelResponse: {
        message: {
          order: {
            fulfillments: [],
          },
        },
      },
    });

    const result = await calculateRefundAmount(
      testData.protocolCancelResponse,
      testData.transaction,
      testData.refundedFl,
      testData.charge
    );

    expect(result.totalRefundedAmount).toBe(0);
    expect(result.refundAmount).toBe(0);
  });

  test("should skip delivery type fulfillments", async () => {
    const testData = createTestVariant({
      protocolCancelResponse: {
        message: {
          order: {
            fulfillments: [
              {
                id: "del1",
                type: "Delivery",
                tags: [
                  {
                    code: "quote_trail",
                    list: [
                      {
                        code: "value",
                        value: "-20.00",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const result = await calculateRefundAmount(
      testData.protocolCancelResponse,
      testData.transaction,
      testData.refundedFl,
      testData.charge
    );

    expect(result.totalRefundedAmount).toBe(0);
  });

  test("should throw error for invalid transaction amount", async () => {
    await expect(
      calculateRefundAmount(
        baseProtocolResponse,
        { amount: "invalid" },
        [],
        baseCharge
      )
    ).rejects.toThrow("Invalid transaction amount");
  });

  test("should sum multiple quote trails for a fulfillment", async () => {
    const testData = createTestVariant({
      protocolCancelResponse: {
        message: {
          order: {
            fulfillments: [
              {
                id: "fl1",
                type: "Item",
                tags: [
                  {
                    code: "quote_trail",
                    list: [
                      {
                        code: "value",
                        value: "-60.00",
                      },
                    ],
                  },
                  {
                    code: "quote_trail",
                    list: [
                      {
                        code: "value",
                        value: "-40.00",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const result = await calculateRefundAmount(
      testData.protocolCancelResponse,
      testData.transaction,
      testData.refundedFl,
      testData.charge
    );

    expect(result.refundAmount).toBe(100);
  });
});

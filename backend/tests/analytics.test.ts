import { describe, it, expect, beforeEach } from "@jest/globals";
import { analyticsService } from "../src/services/analyticsService.js";

/**
 * A/B Analytics — service contract tests.
 *
 * These cover the exact helpers the call pipelines use:
 *   recordVariantForCall()  → called after a CALL-E call starts
 *   recordVariantOutcome()  → called when the CALL-E webhook completes
 *   getVariantStats()       → feeds the Analytics dashboard
 *   getWinningVariant()     → A/B winner rule (requires >= 5 calls)
 *
 * Tests use a fresh store in beforeEach.
 */
describe("AnalyticsService — A/B variant tracking", () => {
  beforeEach(() => {
    analyticsService.clear();
  });

  it("recordVariantForCall records a selection for an active playbook", async () => {
    await analyticsService.recordVariantForCall(
      { id: "variant_one", name: "Empathy A" },
      {
        scenario: "payment_failed",
        callId: "call_one",
        customerName: "John Doe",
        mrr: 500,
      }
    );

    const stats = await analyticsService.getVariantStats("payment_failed");
    const variant = stats.find((s) => s.variantId === "variant_one");
    expect(variant).toBeDefined();
    expect(variant!.totalCalls).toBe(1);
    expect(variant!.inProgress).toBe(1);
    expect(variant!.recovered).toBe(0);
    expect(variant!.totalMRR).toBe(500);
  });

  it("recordVariantForCall is a no-op when no playbook variant exists", async () => {
    const before = (await analyticsService.getVariantStats("payment_failed")).length;

    await analyticsService.recordVariantForCall(null, {
      scenario: "payment_failed",
      callId: "call_null",
      customerName: "Jane Doe",
      mrr: 500,
    });

    const after = (await analyticsService.getVariantStats("payment_failed")).length;
    expect(after).toBe(before);
  });

  it("recordVariantOutcome marks a tracked call recovered", async () => {
    await analyticsService.recordVariantSelection({
      variantId: "variant_two",
      variantName: "Empathy B",
      scenario: "subscription_canceled",
      callId: "call_two",
      customerName: "Acme Corp",
      mrr: 1000,
    });

    await analyticsService.recordVariantOutcome("call_two", "recovered");

    const stats = await analyticsService.getVariantStats("subscription_canceled");
    const variant = stats.find((s) => s.variantId === "variant_two");
    expect(variant).toBeDefined();
    expect(variant!.totalCalls).toBe(1);
    expect(variant!.recovered).toBe(1);
    expect(variant!.recoveredMRR).toBe(1000);
    expect(variant!.recoveryRate).toBe(100);
  });

  it("recordVariantOutcome is a no-op for unknown call ids", async () => {
    const before = (await analyticsService.getVariantStats("payment_failed")).length;

    await analyticsService.recordVariantOutcome("call_unknown", "failed");

    const after = (await analyticsService.getVariantStats("payment_failed")).length;
    expect(after).toBe(before);
  });

  it("getWinningVariant requires at least 5 calls before declaring a winner", async () => {
    for (let i = 0; i < 4; i++) {
      await analyticsService.recordVariantSelection({
        variantId: "variant_win",
        variantName: "Winner Variant",
        scenario: "payment_failed",
        callId: `call_win_${i}`,
        customerName: "Beta Inc",
        mrr: 100,
      });
      await analyticsService.recordVariantOutcome(`call_win_${i}`, "recovered");
    }

    // 4 calls — not enough for a winner
    expect(await analyticsService.getWinningVariant("payment_failed")).toBeNull();

    // 5th call — winner emerges with 100% recovery rate
    await analyticsService.recordVariantSelection({
      variantId: "variant_win",
      variantName: "Winner Variant",
      scenario: "payment_failed",
      callId: "call_win_5",
      customerName: "Beta Inc",
      mrr: 100,
    });
    await analyticsService.recordVariantOutcome("call_win_5", "recovered");

    const winner = await analyticsService.getWinningVariant("payment_failed");
    expect(winner?.variantId).toBe("variant_win");
    expect(winner?.recoveryRate).toBe(100);
  });
});

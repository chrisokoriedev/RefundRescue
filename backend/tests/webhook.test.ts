import request from "supertest";
import {
  describe,
  it,
  expect,
  jest,
  afterEach,
  beforeEach,
} from "@jest/globals";
import Stripe from "stripe";

// ── Build a mock Stripe client with controllable constructEvent ──
const mockConstructEvent = jest.fn<any>();
const mockStripeClient = {
  webhooks: {
    constructEvent: mockConstructEvent,
  },
  customers: {
    retrieve: jest.fn<any>().mockResolvedValue({
      id: "cus_test",
      name: "Test Customer",
      phone: "+15551234567",
      metadata: { companyName: "Test Inc" },
    }),
  },
} as unknown as Stripe;

// ── Mock store methods (must be defined before app import) ──
const mockAddLog = jest.fn<any>().mockImplementation((record: any) => {
  return Promise.resolve({ ...record, id: record.id || "evt_test123" });
});
const mockUpdateLog = jest.fn<any>().mockResolvedValue(undefined);
const mockGetLogs = jest.fn<any>().mockResolvedValue([]);
const mockGetMetrics = jest.fn<any>().mockResolvedValue({
  totalCalls: 0,
  recoveredRevenue: 0,
  successfulRecoveries: 0,
  failedRecoveries: 0,
  activeCalls: 0,
  conversionRate: 0,
});
const mockHasEventBeenProcessed = jest.fn<any>().mockResolvedValue(false);

jest.mock("../src/services/recoveryStore.js", () => ({
  store: {
    addLog: mockAddLog,
    updateLog: mockUpdateLog,
    getLogs: mockGetLogs,
    getMetrics: mockGetMetrics,
    hasEventBeenProcessed: mockHasEventBeenProcessed,
    clearInMemory: jest.fn(),
  },
}));

jest.mock("../src/services/calleService.js", () => ({
  calleService: {
    planCall: jest.fn<any>().mockResolvedValue({ planId: "plan_test" }),
    runCall: jest.fn<any>().mockResolvedValue({ callRunId: "run_test" }),
    getAuthStatus: jest.fn<any>().mockResolvedValue({ success: true }),
    startCall: jest.fn<any>().mockResolvedValue({ runId: "run_test", status: "PREPARING", message: "ok", ok: true }),
    waitForCompletion: jest.fn<any>().mockResolvedValue({
      runId: "run_test", status: "COMPLETED", message: "done",
      summary: "Call completed", transcript: "[BOT] Hello\n[USER] Hi", outcome: null, activity: [], ok: true,
    }),
  },
}));

jest.mock("../src/services/slackService.js", () => ({
  slackService: {
    sendRecoveryAlert: jest.fn(),
    sendCallNotification: jest.fn<any>().mockResolvedValue(true),
  },
}));

jest.mock("../src/services/smsService.js", () => ({
  smsService: {
    sendPaymentLink: jest.fn<any>().mockResolvedValue(true),
  },
}));

jest.mock("../src/services/stripeMetrics.js", () => ({
  createPaymentLink: jest.fn<any>().mockResolvedValue("http://localhost:3000/mock/checkout/test"),
  updateCustomerMetadata: jest.fn<any>().mockResolvedValue(undefined),
  updateInvoiceMetadata: jest.fn<any>().mockResolvedValue(undefined),
}));

// Import app AFTER mocks are set up
import { app } from "../src/server.js";
import { _overrideStripeClient } from "../src/controllers/webhookController.js";
import { analyticsService } from "../src/services/analyticsService.js";
import { smsService } from "../src/services/smsService.js";
import {
  createPaymentLink,
  updateCustomerMetadata,
  updateInvoiceMetadata,
} from "../src/services/stripeMetrics.js";

describe("Webhook Endpoints — Signature Verification & Idempotency", () => {
  beforeEach(() => {
    jest.spyOn(global, "setTimeout").mockImplementation((cb: any) => {
      cb();
      return 0 as any;
    });
    mockConstructEvent.mockReset();
    mockAddLog.mockClear();
    mockUpdateLog.mockClear();
    mockGetLogs.mockReset();
    mockGetLogs.mockResolvedValue([]);
    mockHasEventBeenProcessed.mockReset();
    mockHasEventBeenProcessed.mockResolvedValue(false);
    // Inject the mock Stripe client into the controller
    _overrideStripeClient(mockStripeClient);
  });

  afterEach(() => {
    (global.setTimeout as any).mockRestore();
    jest.clearAllMocks();
  });

  // ── Signature Verification Tests ──

  it("POST /api/webhooks/stripe should fail without stripe-signature header", async () => {
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .send({ type: "invoice.payment_failed" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Missing stripe-signature header");
  });

  it("POST /api/webhooks/stripe should return 400 for invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "invalid_sig")
      .send({ type: "invoice.payment_failed" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Webhook Error");
  });

  it("POST /api/webhooks/stripe should return 200 for valid verified event", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_valid_123",
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_test",
          amount_due: 10000,
          customer_email: "test@example.com",
          customer_name: "Test Customer",
        },
      },
    });

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=123,v1=valid_signature")
      .send(JSON.stringify({ type: "invoice.payment_failed" }));

    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
    expect(res.body.message).toContain("Test Customer");
  });

  // ── Idempotency Tests ──

  it("should return 200 and skip processing for duplicate event IDs", async () => {
    const mockEvent = {
      id: "evt_duplicate_456",
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_test",
          amount_due: 5000,
          customer_email: "dup@example.com",
          customer_name: "Dup Customer",
        },
      },
    };

    mockConstructEvent.mockReturnValue(mockEvent);

    // First call — should process normally
    const res1 = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1,v1=first")
      .send(JSON.stringify(mockEvent));

    expect(res1.status).toBe(200);
    expect(res1.body.data.received).toBe(true);

    // Make the idempotency check return true for the second call
    mockHasEventBeenProcessed.mockResolvedValueOnce(true);

    // Second call — should be idempotent
    const res2 = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=2,v1=second")
      .send(JSON.stringify(mockEvent));

    expect(res2.status).toBe(200);
    expect(res2.body.message).toContain("already processed");
  });
});

// ── CALL-E Webhook Tests ──
describe("CALL-E Webhook — Real-time Status Updates", () => {
  beforeEach(() => {
    mockGetLogs.mockReset();
    mockGetLogs.mockImplementation(() => Promise.resolve([]));
    (smsService.sendPaymentLink as any).mockClear();
    (updateCustomerMetadata as any).mockClear();
    (updateInvoiceMetadata as any).mockClear();
  });

  it("POST /api/webhooks/calle should return 400 for invalid payload", async () => {
    const res = await request(app)
      .post("/api/webhooks/calle")
      .send({});

    expect(res.status).toBe(400);
  });

  it("POST /api/webhooks/calle should return 200 when no matching log found", async () => {
    mockGetLogs.mockImplementation(() => Promise.resolve([]));

    const res = await request(app)
      .post("/api/webhooks/calle")
      .send({
        call_id: "call_no_match_xyz",
        status: "COMPLETED",
      });

    // Should return 200 — webhook always acknowledges receipt
    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
  });

  it("POST /api/webhooks/calle should update log and send Slack for matching call", async () => {
    mockGetLogs.mockImplementation(() => Promise.resolve([
      {
        id: "log_123",
        customerName: "John Doe",
        companyName: "Acme",
        phone: "+1234567890",
        scenario: "payment_failed",
        mrr: 500,
        callRunId: "call_unique_789",
        stripeCustomerId: "cus_recovery_1",
        stripeInvoiceId: "in_recovery_1",
        status: "in_progress",
      },
    ]));

    // Seed the A/B selection the pipeline would have recorded (callId = runId)
    await analyticsService.recordVariantSelection({
      variantId: "variant_webhook",
      variantName: "Webhook Variant",
      scenario: "payment_failed",
      callId: "call_unique_789",
      customerName: "John Doe",
      mrr: 500,
    });

    const res = await request(app)
      .post("/api/webhooks/calle")
      .send({
        call_id: "call_unique_789",
        status: "COMPLETED",
        duration_seconds: 45,
        transcript: "[BOT] Hello\n[USER] Hi\n[BOT] Goodbye",
        summary: "Customer agreed to update payment",
        extracted_data: { outcome: "Saved", churn_reason: "Expired Card" },
      });

    // Should return 200 and acknowledge receipt
    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);

    // ── A/B analytics wiring: a completed call records the recovered outcome ──
    const stats = await analyticsService.getVariantStats("payment_failed");
    const variant = stats.find((s) => s.variantId === "variant_webhook");
    expect(variant).toBeDefined();
    expect(variant!.recovered).toBe(1);
    expect(variant!.failed).toBe(0);
    expect(variant!.recoveryRate).toBe(100);

    // ── Stripe metrics export: metadata updates pushed on terminal outcome (#19) ──
    expect(updateCustomerMetadata).toHaveBeenCalledWith(
      "cus_recovery_1",
      expect.objectContaining({ recoveredMRR: 500 })
    );
    expect(updateInvoiceMetadata).toHaveBeenCalledWith(
      "in_recovery_1",
      expect.objectContaining({ recovered: true })
    );

    // ── SMS only fires on failed recovery — not on success ──
    expect(smsService.sendPaymentLink).not.toHaveBeenCalled();
  });

  it("POST /api/webhooks/calle should send SMS payment link and mark Stripe metadata failed", async () => {
    mockGetLogs.mockImplementation(() => Promise.resolve([
      {
        id: "log_fail_1",
        customerName: "Jane Doe",
        companyName: "Acme",
        phone: "+15550192831",
        scenario: "payment_failed",
        mrr: 299,
        callRunId: "call_failed_555",
        stripeCustomerId: "cus_fail_1",
        stripeInvoiceId: "in_fail_1",
        status: "in_progress",
      },
    ]));

    const res = await request(app)
      .post("/api/webhooks/calle")
      .send({
        call_id: "call_failed_555",
        status: "FAILED",
        duration_seconds: 12,
        summary: "Customer did not answer",
      });

    expect(res.status).toBe(200);

    // ── SMS fallback: payment link texted to the customer (#13) ──
    expect(smsService.sendPaymentLink).toHaveBeenCalledWith(
      "+15550192831",
      299,
      expect.stringContaining("mock/checkout"),
      expect.objectContaining({ customerName: "Jane Doe", scenario: "payment_failed" })
    );

    // ── The payment link itself was generated for the failed invoice (#19) ──
    expect(createPaymentLink).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cus_fail_1", amount: 299 })
    );

    // ── Stripe metrics marked as failed recovery (#19) ──
    expect(updateCustomerMetadata).toHaveBeenCalledWith(
      "cus_fail_1",
      expect.objectContaining({ recoveredMRR: 0 })
    );
    expect(updateInvoiceMetadata).toHaveBeenCalledWith(
      "in_fail_1",
      expect.objectContaining({ recovered: false })
    );
  });
});

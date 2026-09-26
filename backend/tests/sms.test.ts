import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import type { Twilio } from "twilio";
import { config } from "../src/config/index.js";

// Forwarding mock: keep ALL real websocketService functions (emitCallStarted,
// emitCallCompleted, ...) and only override emitSmsSent. Subsequent test files
// sharing this worker therefore still get the real module, avoiding the ESM
// mock-registry pollution documented in jest.config (maxWorkers note).
// NOTE: must be a sync factory — an async one returns a Promise that Jest
// assigns as the module exports, leaving named imports undefined.
jest.mock("../src/services/websocketService.js", () => {
  const actual = jest.requireActual<typeof import("../src/services/websocketService.js")>(
    "../src/services/websocketService.js"
  );
  return { ...actual, emitSmsSent: jest.fn() };
});

import { emitSmsSent } from "../src/services/websocketService.js";
import { smsService } from "../src/services/smsService.js";

describe("SmsService — Live SMS Payment Link Broadcast", () => {
  beforeEach(() => {
    (emitSmsSent as jest.Mock).mockClear();
    smsService._overrideTwilioClient(null);
    config.twilioFromNumber = "";
  });

  afterEach(() => {
    config.twilioFromNumber = "";
  });

  it("sendPaymentLink should broadcast an sms:sent event with customer context", async () => {
    await smsService.sendPaymentLink(
      "+15550192831",
      299,
      "http://localhost:3000/mock/checkout/abc",
      { customerName: "Jane Doe", scenario: "payment_failed" }
    );

    expect(emitSmsSent).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "+15550192831",
        amount: 299,
        paymentUrl: "http://localhost:3000/mock/checkout/abc",
        customerName: "Jane Doe",
        scenario: "payment_failed",
      })
    );
    expect(emitSmsSent).toHaveBeenCalledTimes(1);
  });

  it("sendPaymentLink should broadcast even without optional context", async () => {
    await smsService.sendPaymentLink("+15559998888", 500, "http://localhost:3000/mock/checkout/xyz");

    expect(emitSmsSent).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "+15559998888",
        amount: 500,
        timestamp: expect.any(String),
      })
    );
  });

  it("sendPaymentLink should deliver via Twilio when a client is configured", async () => {
    const mockCreate = jest.fn<any>().mockResolvedValue({ sid: "SM123456789" });
    const fakeClient = {
      messages: { create: mockCreate },
    } as unknown as Twilio;
    smsService._overrideTwilioClient(fakeClient);
    config.twilioFromNumber = "+15005550006";

    const result = await smsService.sendPaymentLink(
      "+15550192831",
      299,
      "http://localhost:3000/mock/checkout/abc",
      { customerName: "Jane Doe", scenario: "payment_failed" }
    );

    expect(mockCreate).toHaveBeenCalledWith({
      from: "+15005550006",
      to: "+15550192831",
      body: expect.stringContaining("http://localhost:3000/mock/checkout/abc"),
    });
    expect(result).toEqual({
      delivered: true,
      channel: "twilio",
      messageSid: "SM123456789",
    });
    // The live event reflects real delivery, not the dev fallback
    expect(emitSmsSent).toHaveBeenCalledWith(
      expect.objectContaining({ delivered: true, channel: "twilio" })
    );
  });

  it("sendPaymentLink should fall back to console when Twilio delivery throws", async () => {
    const mockCreate = jest.fn<any>().mockRejectedValue(new Error("E.212 invalid phone number"));
    const fakeClient = {
      messages: { create: mockCreate },
    } as unknown as Twilio;
    smsService._overrideTwilioClient(fakeClient);
    config.twilioFromNumber = "+15005550006";

    const result = await smsService.sendPaymentLink("+15550192831", 299, "http://localhost:3000/mock/checkout/abc");

    expect(mockCreate).toHaveBeenCalled();
    expect(result.delivered).toBe(false);
    expect(result.channel).toBe("console");
    expect(result.error).toBe("E.212 invalid phone number");
    // The live dashboard event still fires on the fallback path — flagged as not delivered
    expect(emitSmsSent).toHaveBeenCalledWith(expect.objectContaining({ delivered: false, channel: "console" }));
  });

  it("sendPaymentLink should fall back to console when a client exists but no from number is set", async () => {
    const mockCreate = jest.fn<any>();
    smsService._overrideTwilioClient({ messages: { create: mockCreate } } as unknown as Twilio);
    // config.twilioFromNumber is reset to "" in beforeEach

    const result = await smsService.sendPaymentLink("+15550192831", 100, "http://localhost:3000/mock/checkout/abc");

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.delivered).toBe(false);
    expect(result.channel).toBe("console");
  });
});

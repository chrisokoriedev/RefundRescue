import twilio from 'twilio';
import { config } from '../config/index.js';
import { emitSmsSent } from './websocketService.js';

type TwilioClient = twilio.Twilio;

export interface SmsDeliveryResult {
  delivered: boolean;
  channel: 'twilio' | 'console';
  messageSid?: string;
  error?: string;
}

export class SmsService {
  private twilioClient: TwilioClient | null = null;

  /** Allow tests to inject a fake Twilio client */
  _overrideTwilioClient(client: TwilioClient | null): void {
    this.twilioClient = client;
  }

  private getTwilioClient(): TwilioClient | null {
    if (this.twilioClient) return this.twilioClient;
    // Only build a client when we can actually send — a from number is required.
    if (config.twilioAccountSid && config.twilioAuthToken && config.twilioFromNumber) {
      this.twilioClient = new twilio.Twilio(config.twilioAccountSid, config.twilioAuthToken);
    }
    return this.twilioClient;
  }

  /**
   * Send the customer a one-click payment link via SMS.
   *
   * When Twilio credentials are configured this delivers the message for real
   * and returns the message SID. Otherwise it falls back to a console log so
   * local development, demos, and tests keep working.
   */
  async sendPaymentLink(
    phone: string,
    amount: number,
    paymentUrl: string,
    context: { customerName?: string; scenario?: string } = {}
  ): Promise<SmsDeliveryResult> {
    const body = `Action required: Your payment of $${amount} failed. Please update your card here to avoid service interruption: ${paymentUrl}`;

    let result: SmsDeliveryResult = { delivered: false, channel: 'console' };

    const client = this.getTwilioClient();
    if (client && config.twilioFromNumber) {
      try {
        const message = await client.messages.create({
          from: config.twilioFromNumber,
          to: phone,
          body,
        });
        console.log(`[SmsService] SMS delivered via Twilio to ${phone} — sid: ${message.sid}`);
        result = { delivered: true, channel: 'twilio', messageSid: message.sid };
      } catch (err: any) {
        console.warn(`[SmsService] Twilio send failed (${err?.message}) — falling back to console log`);
        result = { delivered: false, channel: 'console', error: err?.message };
      }
    } else {
      console.log(`[SmsService] Twilio not configured — logging SMS for ${phone}`);
    }

    console.log(`[SmsService] Message: "${body}"`);

    // Broadcast the fallback-channel event to the live dashboard (#21)
    emitSmsSent({
      phone,
      amount,
      paymentUrl,
      customerName: context.customerName,
      scenario: context.scenario,
      delivered: result.delivered,
      channel: result.channel,
      timestamp: new Date().toISOString(),
    });

    return result;
  }
}

export const smsService = new SmsService();

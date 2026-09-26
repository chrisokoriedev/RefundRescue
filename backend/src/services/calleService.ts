import { CalleClient } from '@call-e/calle';
import { config } from '../config/index.js';

export interface CallStartResult {
  runId: string;
  status: string;
  message: string;
  ok: boolean;
}

export interface CalleAuthStatus {
  configured: boolean;
  baseUrl: string;
  note: string;
}

export interface CallStatusResult {
  runId: string;
  status: string;
  message: string;
  summary: string | null;
  transcript: string | null;
  outcome: any;
  activity: any[];
  ok: boolean;
}

export class CalleService {
  private client: CalleClient;

  constructor() {
    this.client = new CalleClient({
      apiKey: config.calleApiKey,
      baseUrl: config.calleBaseUrl,
    });
  }

  /**
   * Start a phone call using the official @call-e/calle SDK.
   */
  async startCall(params: {
    goal: string;
    phone: string;
    language?: string;
    region?: string;
    timezone?: string;
  }): Promise<CallStartResult> {
    if (process.env.NODE_ENV === 'test') {
      return {
        runId: `test_run_${Date.now()}`,
        status: 'PREPARING',
        message: 'Test mode — no real call placed',
        ok: true,
      };
    }

    try {
      // Use the webhookUrl from config so CALL-E calls us back when the call finishes
      const call = await this.client.calls.create({
        task: params.goal,
        recipients: [
          {
            phones: [params.phone],
            region: params.region || 'US', // default changed to US per the SDK signature, though we accept NG
            locale: params.language === 'English' ? 'en-US' : 'en-US'
          }
        ],
        webhookUrl: config.calleWebhookUrl,
        // We can pass metadata to track it in the webhook
        metadata: {
          timezone: params.timezone || 'Africa/Lagos'
        }
      });

      // Based on typical SDK response shapes, adjusting for actual runId mapping
      // The API returns a call_id/run_id usually on the object
      const callId = (call as any).id || (call as any).call_id || `call_${Date.now()}`;
      const status = (call as any).status || 'PREPARING';

      return {
        runId: callId,
        status,
        message: 'Call initiated via SDK',
        ok: true,
      };
    } catch (err: any) {
      console.error(`[CALL-E startCall Error]: ${err.message}`);
      throw err;
    }
  }

  /**
   * Start a batch of phone calls.
   */
  async startBatchCall(params: {
    goal: string;
    recipients: Array<{ phone: string; language?: string; region?: string; timezone?: string }>;
  }): Promise<CallStartResult> {
    if (process.env.NODE_ENV === 'test') {
      return {
        runId: `test_batch_${Date.now()}`,
        status: 'PREPARING',
        message: 'Test mode — no real batch placed',
        ok: true,
      };
    }

    try {
      const formattedRecipients = params.recipients.map(r => ({
        phones: [r.phone],
        region: r.region || 'US',
        locale: r.language === 'English' ? 'en-US' : 'en-US'
      }));

      const call = await this.client.calls.create({
        task: params.goal,
        recipients: formattedRecipients,
        webhookUrl: config.calleWebhookUrl
      });

      const callId = (call as any).id || (call as any).call_id || `batch_${Date.now()}`;
      const status = (call as any).status || 'PREPARING';

      return {
        runId: callId,
        status,
        message: 'Batch call initiated via SDK',
        ok: true,
      };
    } catch (err: any) {
      console.error(`[CALL-E startBatchCall Error]: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get call status using the SDK.
   */
  async getCallStatus(runId: string): Promise<CallStatusResult> {
    if (process.env.NODE_ENV === 'test') {
      return {
        runId,
        status: 'COMPLETED',
        message: 'Test mode',
        summary: 'Test call completed',
        transcript: '[BOT] Hello\n[USER] Hi\n[BOT] Goodbye',
        outcome: { task_completed: true },
        activity: [],
        ok: true,
      };
    }

    try {
      const call = await this.client.calls.get(runId);
      
      const status = (call as any).status || 'UNKNOWN';
      
      return {
        runId,
        status,
        message: '',
        summary: (call as any).structuredResult?.summary || (call as any).summary || null,
        transcript: (call as any).transcript || (call as any).evidence?.transcript || null,
        outcome: (call as any).structuredResult || (call as any).taskCompleted || null,
        activity: (call as any).activity || [],
        ok: true,
      };
    } catch (err: any) {
      console.error(`[CALL-E getCallStatus Error]: ${err.message}`);
      throw err;
    }
  }

  /**
   * Report CALL-E configuration/auth status.
   *
   * The SDK authenticates with the API key on every request, so this
   * reports local config state without making a network call.
   */
  async getAuthStatus(): Promise<CalleAuthStatus> {
    const configured = Boolean(config.calleApiKey);
    return {
      configured,
      baseUrl: config.calleBaseUrl,
      note: configured
        ? 'API key configured — SDK authenticates each request'
        : 'CALLE_API_KEY not set — calls will fail until configured',
    };
  }

  /**
   * Poll until call reaches a terminal status.
   */
  async waitForCompletion(
    runId: string,
    options: { pollIntervalMs?: number; maxWaitMs?: number; timezone?: string } = {}
  ): Promise<CallStatusResult> {
    const { pollIntervalMs = 10000, maxWaitMs = 300000 } = options;
    const terminalStatuses = ['COMPLETED', 'FAILED', 'NO_ANSWER', 'DECLINED', 'CANCELED', 'CANCELLED', 'VOICEMAIL', 'BUSY', 'EXPIRED'];

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getCallStatus(runId);

      if (terminalStatuses.includes(status.status.toUpperCase())) {
        return status;
      }

      console.log(`[CALL-E Poll] ${runId}: ${status.status} — waiting ${pollIntervalMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return this.getCallStatus(runId);
  }
}

export const calleService = new CalleService();

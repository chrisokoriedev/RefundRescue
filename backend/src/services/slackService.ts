export type CallOutcome = 'recovered' | 'failed' | 'no_answer' | 'voicemail' | 'in_progress';

export interface SlackCallNotification {
  customerName: string;
  companyName: string;
  phone: string;
  scenario: string;
  mrr: number;
  outcome: CallOutcome;
  transcript?: string;
  callDuration?: number;
  callId?: string;
}

export class SlackService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
  }

  private getOutcomeConfig(outcome: CallOutcome) {
    switch (outcome) {
      case 'recovered':
        return {
          emoji: '🎉',
          color: '#2eb67d',
          title: 'Customer Recovered!',
          text: 'The customer agreed to stay or update their payment.',
        };
      case 'failed':
        return {
          emoji: '😞',
          color: '#e01e5a',
          title: 'Recovery Failed',
          text: 'The customer declined or the call did not result in recovery.',
        };
      case 'no_answer':
        return {
          emoji: '📵',
          color: '#ecb22e',
          title: 'No Answer',
          text: 'The customer did not pick up. Consider retrying or sending an SMS.',
        };
      case 'voicemail':
        return {
          emoji: '📬',
          color: '#ecb22e',
          title: 'Voicemail Left',
          text: 'A voicemail was left. The customer may call back.',
        };
      case 'in_progress':
      default:
        return {
          emoji: '📞',
          color: '#36c5f0',
          title: 'Call In Progress',
          text: 'The outbound call is currently active.',
        };
    }
  }

  async sendCallNotification(notification: SlackCallNotification): Promise<boolean> {
    if (!this.webhookUrl) {
      console.log(`[SlackService] Webhook URL not configured. Skipping notification for ${notification.customerName}`);
      return false;
    }

    const config = this.getOutcomeConfig(notification.outcome);
    const scenarioLabel = notification.scenario === 'payment_failed' ? '💳 Payment Failed' : '🚫 Subscription Canceled';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${config.emoji} ${config.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: config.text,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Customer:*\n${notification.customerName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Company:*\n${notification.companyName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Phone:*\n${notification.phone}`,
          },
          {
            type: 'mrkdwn',
            text: `*MRR:*\n$${notification.mrr.toLocaleString()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Scenario:*\n${scenarioLabel}`,
          },
          {
            type: 'mrkdwn',
            text: `*Outcome:*\n${notification.outcome.toUpperCase()}`,
          },
        ],
      },
    ];

    if (notification.callDuration) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⏱️ Duration: ${notification.callDuration}s${notification.callId ? ` | 🔗 Call ID: \`${notification.callId}\`` : ''}`,
          },
        ],
      });
    }

    if (notification.transcript) {
      // Truncate long transcripts for Slack
      const truncated = notification.transcript.length > 500
        ? notification.transcript.substring(0, 500) + '...'
        : notification.transcript;

      blocks.push(
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📝 Transcript:*\n\`\`\`${truncated}\`\`\``,
          },
        }
      );
    }

    const payload = {
      text: `${config.emoji} ${config.title}: ${notification.customerName} — $${notification.mrr} MRR`,
      blocks,
    };

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(`[SlackService] HTTP ${res.status}: ${await res.text()}`);
        return false;
      }

      console.log(`[SlackService] ${config.title} notification sent for ${notification.customerName}`);
      return true;
    } catch (err: any) {
      console.error(`[SlackService Error] Failed to send notification: ${err.message}`);
      return false;
    }
  }

  // ── Convenience methods ──

  async sendRecoverySuccess(notification: SlackCallNotification): Promise<boolean> {
    return this.sendCallNotification({ ...notification, outcome: 'recovered' });
  }

  async sendRecoveryFailure(notification: SlackCallNotification): Promise<boolean> {
    return this.sendCallNotification({ ...notification, outcome: 'failed' });
  }

  async sendNoAnswer(notification: SlackCallNotification): Promise<boolean> {
    return this.sendCallNotification({ ...notification, outcome: 'no_answer' });
  }

  async sendCallInProgress(notification: SlackCallNotification): Promise<boolean> {
    return this.sendCallNotification({ ...notification, outcome: 'in_progress' });
  }

  // ── Legacy compatibility ──

  async sendRecoveryAlert(customerName: string, amount: number) {
    return this.sendCallNotification({
      customerName,
      companyName: 'RevRescue Client',
      phone: '',
      scenario: 'payment_failed',
      mrr: amount,
      outcome: 'recovered',
    });
  }
}

export const slackService = new SlackService();

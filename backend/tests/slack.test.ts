import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { slackService } from '../src/services/slackService.js';

describe('SlackService', () => {
  beforeEach(() => {
    // Clear mocks
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not send an alert if webhook URL is not configured', async () => {
    const originalUrl = (slackService as any).webhookUrl;
    (slackService as any).webhookUrl = '';
    
    await slackService.sendRecoveryAlert('Test User', 100);
    
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Restore
    (slackService as any).webhookUrl = originalUrl;
  });

  it('should send an alert if webhook URL is configured', async () => {
    const originalUrl = (slackService as any).webhookUrl;
    (slackService as any).webhookUrl = 'http://mock-slack-url.com';
    
    await slackService.sendRecoveryAlert('Test User', 100);
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('http://mock-slack-url.com');
    const options = fetchCall[1] as RequestInit;
    expect(options.method).toBe('POST');
    const bodyText = JSON.parse(options.body as string).text;
    expect(bodyText).toContain('Test User');
    expect(bodyText).toContain('100');
    
    // Restore
    (slackService as any).webhookUrl = originalUrl;
  });
});

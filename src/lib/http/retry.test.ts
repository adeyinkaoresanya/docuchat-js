import axios from 'axios';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { logger } from '../logger';
import { withRetry } from './retry';

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs retry metadata in pino format', async () => {
    const error = new axios.AxiosError(
      'Request failed',
      'ECONNABORTED',
      undefined,
      undefined,
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'retry-after': '2' },
        config: { headers: {} },
        data: {},
      } as any
    );

    let attempts = 0;

    const result = await withRetry(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw error;
      }

      return 'ok';
    }, { maxAttempts: 2, baseDelayMs: 1000 });

    expect(result).toBe('ok');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        status: 429,
        message: 'Request failed',
      }),
      expect.stringContaining('Attempt 1 failed, retrying in')
    );
  });
});

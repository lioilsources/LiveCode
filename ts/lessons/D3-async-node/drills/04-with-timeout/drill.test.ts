import { TimeoutError, withTimeout } from './drill';

describe('drill 04 — withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('TimeoutError je Error s name "TimeoutError"', () => {
    const e = new TimeoutError(100);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('TimeoutError');
    expect(e.message).toBe('timeout after 100ms');
  });

  it('propustí hodnotu, když Promise stihne', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it('propustí chybu původního Promise', async () => {
    await expect(withTimeout(Promise.reject(new Error('orig')), 1000)).rejects.toThrow('orig');
  });

  it('rejectne TimeoutError, když nestihne', async () => {
    const never = new Promise<number>(() => {});
    const p = withTimeout(never, 100);
    jest.advanceTimersByTime(100);
    await expect(p).rejects.toBeInstanceOf(TimeoutError);
  });

  it('po vyřešení uklidí timer (žádný leak)', async () => {
    await withTimeout(Promise.resolve('x'), 5000);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('uklidí timer i po chybě', async () => {
    await withTimeout(Promise.reject(new Error('e')), 5000).catch(() => {});
    expect(jest.getTimerCount()).toBe(0);
  });
});

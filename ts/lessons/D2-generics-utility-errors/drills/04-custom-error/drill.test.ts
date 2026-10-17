import { errorMessage, NotFoundError, toHttpStatus, ValidationError, withContext } from './drill';

describe('drill 04 — custom errors', () => {
  it('NotFoundError', () => {
    const e = new NotFoundError('user', 'u1');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(NotFoundError);
    expect(e.message).toBe('user u1 not found');
    expect(e.name).toBe('NotFoundError');
    expect([e.entity, e.id]).toEqual(['user', 'u1']);
    expect(e.stack).toContain('NotFoundError');
  });

  it('toHttpStatus', () => {
    expect(toHttpStatus(new NotFoundError('x', '1'))).toBe(404);
    expect(toHttpStatus(new ValidationError('email', 'invalid'))).toBe(400);
    expect(toHttpStatus(new TypeError('x'))).toBe(500);
    expect(toHttpStatus('boom')).toBe(500);
    expect(toHttpStatus(undefined)).toBe(500);
  });

  it('errorMessage', () => {
    expect(errorMessage(new ValidationError('email', 'bad email'))).toBe('bad email');
    expect(errorMessage('plain')).toBe('plain');
    expect(errorMessage({ code: 1 })).toBe('unknown error');
  });

  it('withContext obalí s cause', () => {
    expect(withContext('ok', () => 42)).toBe(42);
    const inner = new NotFoundError('order', 'o1');
    let caught: unknown;
    try {
      withContext('load invoice', () => {
        throw inner;
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe('load invoice: order o1 not found');
    expect((caught as Error).cause).toBe(inner);
  });
});

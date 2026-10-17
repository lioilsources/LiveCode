import { show } from './drill';

describe('drill 02 — narrowing', () => {
  it.each([
    [null, '-'],
    [undefined, '-'],
    ['  hi ', 'hi'],
    ['   ', '(empty)'],
    [3.14159, '3.14'],
    [0, '0.00'],
    [NaN, 'NaN'],
    [true, 'yes'],
    [false, 'no'],
    [new Date('2026-10-17T12:00:00Z'), '2026-10-17'],
  ] as const)('show(%p) = %p', (input, want) => {
    expect(show(input)).toBe(want);
  });
});

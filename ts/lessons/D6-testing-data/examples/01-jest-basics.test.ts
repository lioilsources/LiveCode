// EXAMPLE 01 — Jest základy: matchery, async, test.each, mocky, fake timers
//
//   npx jest lessons/D6-testing-data/examples/01
//
// Čti odshora dolů. Každý `it` ukazuje jednu věc, kterou potřebuješ na pohovoru.

class NotFoundError extends Error {
  constructor(id: number) {
    super(`item ${id} not found`);
    this.name = 'NotFoundError';
  }
}

function parseAge(s: string): number {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`invalid age: ${s}`);
  return n;
}

async function findItem(id: number): Promise<{ id: number }> {
  if (id <= 0) throw new NotFoundError(id);
  return { id };
}

describe('matchery', () => {
  it('toBe = === (primitiva, stejná reference)', () => {
    expect(1 + 1).toBe(2);
    const a = { x: 1 };
    expect(a).toBe(a);
    expect({ x: 1 }).not.toBe({ x: 1 }); // dva různé objekty
  });

  it('toEqual = hluboké porovnání (jako reflect.DeepEqual / cmp.Diff)', () => {
    expect({ x: 1, tags: ['a'] }).toEqual({ x: 1, tags: ['a'] });
    // toEqual ignoruje undefined vlastnosti, toStrictEqual ne
    expect({ x: 1, y: undefined }).toEqual({ x: 1 });
    expect({ x: 1, y: undefined }).not.toStrictEqual({ x: 1 });
  });

  it('toMatchObject = podmnožina (stačí, co mě zajímá)', () => {
    expect({ id: 7, name: 'Olda', createdAt: new Date() }).toMatchObject({ name: 'Olda' });
    expect({ id: 7 }).toEqual({ id: expect.any(Number) });
  });

  it('toThrow — předávám FUNKCI, ne její výsledek', () => {
    expect(() => parseAge('-1')).toThrow(RangeError);
    expect(() => parseAge('abc')).toThrow('invalid age');
    // ŠPATNĚ: expect(parseAge('-1')).toThrow() — výjimka vyletí dřív, než ji expect chytí
  });
});

describe('async', () => {
  it('resolves — await je povinný', async () => {
    await expect(findItem(1)).resolves.toEqual({ id: 1 });
  });

  it('rejects — chyba z Promise', async () => {
    await expect(findItem(0)).rejects.toThrow(NotFoundError);
    await expect(findItem(0)).rejects.toThrow('item 0 not found');
  });

  it('nebo klasicky přes try/await', async () => {
    const item = await findItem(5);
    expect(item.id).toBe(5);
  });
});

// table-driven test — přesně to, co v Go píšeš jako []struct{...} + t.Run
describe('parseAge (test.each = table-driven)', () => {
  test.each([
    { input: '0', want: 0 },
    { input: '42', want: 42 },
    { input: '007', want: 7 },
  ])('parseAge($input) = $want', ({ input, want }) => {
    expect(parseAge(input)).toBe(want);
  });

  test.each(['-1', '1.5', 'abc'])('parseAge(%s) hází RangeError', (input) => {
    expect(() => parseAge(input)).toThrow(RangeError);
  });
});

describe('mocky', () => {
  it('jest.fn — falešná funkce, která si pamatuje volání', async () => {
    const fetchUser = jest.fn<Promise<{ name: string }>, [number]>();
    fetchUser.mockResolvedValueOnce({ name: 'Olda' }).mockRejectedValueOnce(new Error('down'));

    await expect(fetchUser(1)).resolves.toEqual({ name: 'Olda' });
    await expect(fetchUser(2)).rejects.toThrow('down');

    expect(fetchUser).toHaveBeenCalledTimes(2);
    expect(fetchUser).toHaveBeenNthCalledWith(2, 2);
    expect(fetchUser.mock.calls).toEqual([[1], [2]]);
  });

  it('jest.spyOn — obalí existující metodu (a dá se vrátit)', () => {
    const clock = { now: () => Date.now() };
    const spy = jest.spyOn(clock, 'now').mockReturnValue(1000);

    expect(clock.now()).toBe(1000);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore(); // zpět originál
    expect(clock.now()).toBeGreaterThan(1000);
  });
});

describe('fake timers', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('setTimeout bez čekání', () => {
    const cb = jest.fn();
    setTimeout(cb, 5_000);

    jest.advanceTimersByTime(4_999);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('timer + Promise → advanceTimersByTimeAsync', async () => {
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    let done = false;
    const p = sleep(10_000).then(() => {
      done = true;
    });

    await jest.advanceTimersByTimeAsync(10_000); // posune čas A vyprázdní microtasky
    await p;
    expect(done).toBe(true);
  });
});

import { area, assertNever, totalArea, type Shape } from './drill';

describe('drill 03 — discriminated union', () => {
  it('area', () => {
    expect(area({ kind: 'circle', r: 1 })).toBeCloseTo(Math.PI);
    expect(area({ kind: 'rect', w: 2, h: 3 })).toBe(6);
    expect(area({ kind: 'triangle', base: 4, height: 5 })).toBe(10);
  });

  it('totalArea', () => {
    const shapes: Shape[] = [
      { kind: 'rect', w: 1, h: 1 },
      { kind: 'triangle', base: 2, height: 2 },
    ];
    expect(totalArea(shapes)).toBe(3);
    expect(totalArea([])).toBe(0);
  });

  it('neznámá varianta za běhu → assertNever hodí', () => {
    const bogus = { kind: 'hexagon' } as unknown as Shape;
    expect(() => area(bogus)).toThrow();
    expect(() => assertNever('x' as never)).toThrow();
  });
});

// class-transformer potřebuje Reflect API — v Nest aplikaci ho importuje Nest sám
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListQueryDto } from './drill';

// přesně tohle dělá ValidationPipe({ transform: true }) s query stringem
function parse(query: Record<string, string>) {
  const dto = plainToInstance(ListQueryDto, query);
  const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, errors: errors.map((e) => e.property) };
}

describe('ListQueryDto', () => {
  it('defaulty: page=1, limit=20', () => {
    const { dto, errors } = parse({});
    expect(errors).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.role).toBeUndefined();
  });

  it('stringy z URL převede na number', () => {
    const { dto, errors } = parse({ page: '3', limit: '50', role: 'admin' });
    expect(errors).toEqual([]);
    expect(dto.page).toBe(3);
    expect(typeof dto.page).toBe('number');
    expect(dto.limit).toBe(50);
    expect(dto.role).toBe('admin');
  });

  test.each([
    [{ page: '0' }, 'page'],
    [{ page: 'abc' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ limit: '0' }, 'limit'],
    [{ limit: '101' }, 'limit'],
    [{ role: 'root' }, 'role'],
    [{ search: 'x'.repeat(51) }, 'search'],
  ])('%j → chyba v %s', (query, prop) => {
    expect(parse(query as Record<string, string>).errors).toContain(prop);
  });

  it('search je volitelný string', () => {
    const { dto, errors } = parse({ search: 'olda' });
    expect(errors).toEqual([]);
    expect(dto.search).toBe('olda');
  });
});

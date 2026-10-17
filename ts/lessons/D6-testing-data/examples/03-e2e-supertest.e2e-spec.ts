// EXAMPLE 03 — e2e test přes supertest: query DTO se stránkováním, setupApp, overrideGuard
//
//   npx jest lessons/D6-testing-data/examples/03
//
// Ekvivalent Go `httptest.NewServer(handler)` + http.Get — jen nad celou Nest
// aplikací včetně pipes, guardů a exception filtrů.
import {
  CanActivate,
  Controller,
  Get,
  INestApplication,
  Injectable,
  Module,
  Query,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import request from 'supertest';

// --- query DTO: všechno z URL je string → @Type převede na number ---------------
const CATEGORIES = ['book', 'game'] as const;

class ListProductsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: (typeof CATEGORIES)[number];
}

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface Product {
  id: number;
  name: string;
  category: (typeof CATEGORIES)[number];
}

// --- "produkční" kód ---------------------------------------------------------
@Injectable()
class ApiKeyGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException(); // v produkci by kontroloval hlavičku
  }
}

@Injectable()
class ProductsService {
  private readonly products: Product[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `product-${i + 1}`,
    category: i % 2 === 0 ? 'book' : 'game',
  }));

  list(q: ListProductsQuery): Page<Product> {
    const filtered = q.category ? this.products.filter((p) => p.category === q.category) : this.products;
    const start = (q.page - 1) * q.limit;
    return { items: filtered.slice(start, start + q.limit), total: filtered.length, page: q.page, limit: q.limit };
  }
}

@Controller('products')
@UseGuards(ApiKeyGuard)
class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() q: ListProductsQuery) {
    return this.products.list(q);
  }
}

@Module({ controllers: [ProductsController], providers: [ProductsService, ApiKeyGuard] })
class ProductsModule {}

// sdílené s main.ts — e2e test MUSÍ mít stejné globální pipes jako produkce
function setupApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app;
}

// ============================================================================

describe('GET /products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ProductsModule] })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true }) // auth testujeme jinde
      .compile();

    app = setupApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app.close(); // bez toho Jest visí: "did not exit one second after the test run"
  });

  it('default page=1, limit=10', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(res.body).toMatchObject({ total: 25, page: 1, limit: 10 });
    expect(res.body.items).toHaveLength(10);
  });

  it('page + limit + filtr (čísla dorazí jako number díky transform)', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .query({ page: 2, limit: 5, category: 'game' })
      .expect(200);
    expect(res.body).toMatchObject({ total: 12, page: 2, limit: 5 });
    expect(res.body.items.map((p: Product) => p.id)).toEqual([12, 14, 16, 18, 20]);
  });

  it.each([
    ['limit=1000', 'limit nad maximum'],
    ['page=0', 'page pod minimum'],
    ['page=abc', 'není číslo'],
    ['category=car', 'není v enumu'],
    ['foo=bar', 'neznámý parametr (forbidNonWhitelisted)'],
  ])('?%s → 400 (%s)', async (qs) => {
    await request(app.getHttpServer()).get(`/products?${qs}`).expect(400);
  });
});

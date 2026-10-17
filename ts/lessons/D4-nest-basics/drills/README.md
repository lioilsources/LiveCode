# D4 drills — Nest tvar do prstů

> Ne na pochopení, ale na **psaní**. Každý drill je prázdný soubor se zadáním
> v komentáři + test. Cíl: napsat controller/service/module/DTO **bez
> přemýšlení nad dekorátory**, aby na pohovoru zbyla hlava na doménu.

## Jak drilovat

1. Otevři `drill.ts` — je **prázdný** (jen zadání).
2. Napiš řešení bez koukání do LESSON.md a examples.
3. `npx jest lessons/D4-nest-basics/drills/01` — dokud chybí exporty, test
   spadne na chybě typů (`File '.../drill.ts' is not a module`, pak
   `Module './drill' has no exported member ...`). To je záměr.
4. Po všech šesti obsah smaž a jeď znovu. Cíl: každý do 4 minut, třetí kolo naslepo.

```bash
npx jest lessons/D4-nest-basics/drills        # všechny
```

| # | Drill | Sval |
|---|---|---|
| 01 | controller | `@Controller`, `@Get/@Post`, `@HttpCode`, `@Module` |
| 02 | service-di | `@Injectable`, constructor injection, singleton stav |
| 03 | params-pipes | `@Param` + `ParseIntPipe`, `@Query` + `DefaultValuePipe`, `@Headers`, pořadí rout |
| 04 | dto-validation | DTO třída, `class-validator`, `PartialType` |
| 05 | exceptions | `NotFound/Conflict/BadRequestException`, `204` |
| 06 | custom-provider | `Symbol` token, `useValue/useClass/useFactory`, `@Inject` |

## 6 tvarů, které chceš mít v prstech

Přečti jednou, zavři, piš.

```ts
// 1) Service
@Injectable()
export class XService {
  private readonly items = new Map<number, Item>();
}

// 2) Controller — DI přes parameter property
@Controller('xs')
export class XController {
  constructor(private readonly xs: XService) {}

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) { return this.xs.get(id); }

  @Post()
  create(@Body() dto: CreateXDto) { return this.xs.create(dto); }   // 201

  @Delete(':id') @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) { this.xs.remove(id); }
}

// 3) Module
@Module({ controllers: [XController], providers: [XService], exports: [XService] })
export class XModule {}

// 4) DTO
export class CreateXDto {
  @IsString() @Length(1, 100) name!: string;
  @IsOptional() @IsInt() @Min(0) qty?: number;
}
export class UpdateXDto extends PartialType(CreateXDto) {}

// 5) Výjimka
if (!item) throw new NotFoundException(`x ${id} not found`);

// 6) Custom token
export const REPO = Symbol('REPO');
providers: [{ provide: REPO, useClass: InMemoryRepo }]
constructor(@Inject(REPO) private readonly repo: Repo) {}
```

Testy v drillech jsou zároveň vzor e2e testu (`Test.createTestingModule` +
`supertest`) — ten v D6 budeš psát sám.

# Drills D6 — testovatelný Nest kód do prstů

> Stejná metodika jako Go drilly v lekci 11: **prázdný soubor + test**. Píšeš
> produkční kód, test ho hlídá. Cíl: na live codingu napsat repozitář, service
> s chybami a stránkovaný endpoint **bez přemýšlení nad dekorátory**.

## Jak drilovat

1. Otevři `drill.ts` — je **prázdný** (jen zadání v komentáři).
2. Napiš řešení bez koukání do `LESSON.md` a examples.
3. `npx jest lessons/D6-testing-data/drills/01` → zelená → další.
4. Po všech pěti smaž a jeď znovu. Cíl 3. kola: každý drill pod 4 minuty.

Dokud je `drill.ts` prázdný, test **spadne na kompilaci** (`Module has no
exported member 'paginate'`) — to je v pořádku, hláška ti řekne, co chybí.

| # | Drill | Sval | Cíl |
|---|---|---|---|
| 01 | `paginate<T>` | generická funkce, `slice`, tvar `{items,total,page,limit}` | 2 min |
| 02 | `ListQueryDto` | `@IsOptional @Type(() => Number) @IsInt @Min @Max @IsIn`, default přes inicializátor | 3 min |
| 03 | `ProductsRepository` + in-memory | **abstract class jako DI token**, `Map`, `useClass` | 3 min |
| 04 | `ProductsService` | constructor injection, `NotFoundException`, `ConflictException` | 3 min |
| 05 | `NotesModule` + `setupApp` | controller/service/DTO/modul naráz, `ParseIntPipe`, globální `ValidationPipe` | 6 min |

## 5 tvarů, které chceš mít v prstech

```ts
// 1) query DTO — z URL přijde VŽDY string
class ListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @IsIn(['admin', 'member']) role?: 'admin' | 'member';
}

// 2) kontrakt repozitáře = abstraktní třída (existuje za běhu → DI token)
export abstract class UsersRepository {
  abstract findById(id: number): Promise<User | undefined>;
}

// 3) registrace implementace v modulu
providers: [UsersService, { provide: UsersRepository, useClass: InMemoryUsersRepository }]

// 4) unit test — mock pod stejným tokenem
const repo: jest.Mocked<UsersRepository> = { findById: jest.fn() };
await Test.createTestingModule({
  providers: [UsersService, { provide: UsersRepository, useValue: repo }],
}).compile();

// 5) e2e — stejné pipes jako main.ts, na konci close
app = setupApp(moduleRef.createNestApplication());
await app.init();
afterAll(() => app.close());
```

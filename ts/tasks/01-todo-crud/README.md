# Task 01 — Todo CRUD v Nestu od nuly

**Časový limit: 40 minut** · NestJS · vzor: modul → controller → service → DTO + validace → e2e

Tohle je **nejpravděpodobnější** zadání na Node/Nest live codingu: „postav malé
REST API". Nejde o algoritmus, jde o to, jestli Nest máš v prstech a jestli
myslíš na stavové kódy, validaci a hraniční případy.

## Zadání

Postav `TasksModule` s in-memory úložištěm (žádná DB).

```ts
interface Task {
  id: string;            // UUID (crypto.randomUUID())
  title: string;         // 1–200 znaků, povinný
  description?: string;  // max 1000 znaků
  status: 'todo' | 'in_progress' | 'done'; // default 'todo'
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
}
```

| Metoda | Cesta | Úspěch | Chyby |
|---|---|---|---|
| `POST` | `/tasks` | **201** + task | 400 nevalidní body / neznámé pole |
| `GET` | `/tasks?status=done` | 200 + pole (filtr volitelný) | 400 neznámý status |
| `GET` | `/tasks/:id` | 200 + task | 400 id není UUID, 404 neexistuje |
| `PATCH` | `/tasks/:id` | 200 + task (mění jen poslaná pole; `null` ignoruje) | 400, 404 |
| `DELETE` | `/tasks/:id` | **204** prázdné tělo | 400, 404 |

Soubory: `task.dto.ts`, `tasks.service.ts`, `tasks.controller.ts`,
`tasks.module.ts`, doplň `app.module.ts` a `app.setup.ts`.
Test importuje jen `AppModule` a `configureApp` — vnitřní strukturu máš volnou.

```bash
npx jest tasks/01-todo-crud/tasks       # tvoje řešení
npx jest tasks/01-todo-crud/solution    # referenční
npx tsx tasks/01-todo-crud/main.ts      # ručně: curl localhost:3000/tasks
```

## Co interviewer sleduje

- Postup: **nejdřív nahlas** zopakuješ endpointy a kódy, pak kostra, pak happy path.
- Vrstvy: controller je tenký (HTTP), logika a `NotFoundException` v service.
- DI přes konstruktor (`constructor(private readonly tasks: TasksService)`).
- Validace na hranici: DTO třídy + `ValidationPipe`, ne ruční `if` v controlleru.
- Správné kódy: 201 vs 200, 204 bez těla, 404 vs 400.
- Řekneš, co bys udělal jinak v produkci (DB + repository, stránkování, `ParseUUIDPipe`, optimistic locking přes `updatedAt`/version).

<details>
<summary>Hint 1 — proč DTO musí být třída</summary>

TS typy za běhu neexistují. `ValidationPipe` čte metadata z dekorátorů na
**třídě** (`@IsString()`, `@Length(1, 200)`), a typ parametru z
`emitDecoratorMetadata`. S `interface CreateTaskDto` se nevaliduje nic — tiše.
</details>

<details>
<summary>Hint 2 — options ValidationPipe</summary>

`whitelist: true` zahodí nedekorovaná pole, `forbidNonWhitelisted: true` z nich
udělá 400, `transform: true` udělá z plain objectu instanci DTO. Globální pipe
v `main.ts` se **v testu neaplikuje** — proto `configureApp()` sdílený oběma.
</details>

<details>
<summary>Hint 3 — PATCH a status kódy</summary>

`UpdateTaskDto extends PartialType(CreateTaskDto)` z `@nestjs/mapped-types`.
`@IsOptional()` propustí `undefined` **i `null`** — odfiltruj je před spreadem.
`@HttpCode(HttpStatus.NO_CONTENT)` na DELETE. `@Param('id', ParseUUIDPipe)` dá 400.
Filtr `?status=` validuj query DTO třídou s `@IsOptional() @IsEnum(TaskStatus)`.
</details>

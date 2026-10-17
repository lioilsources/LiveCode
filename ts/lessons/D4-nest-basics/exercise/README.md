# D4 exercise — `BooksModule` (kompletní CRUD)

**Časový limit: 35 minut** · tohle je nejpravděpodobnější tvar live codingu.

Kostra je v `books/`. Zkompiluje se, ale všechno hází `TODO` a routy chybí.
Test (`books/books.e2e-spec.ts`) nastartuje `BooksModule` se stejným
`ValidationPipe`, jaký bys dal do `main.ts`:

```ts
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
```

```bash
npx jest lessons/D4-nest-basics/exercise
```

## Zadání

`Book = { id, title, author, isbn, year, tags }` (viz `book.entity.ts`),
ukládej in-memory.

| Endpoint | Úspěch | Chyby |
|---|---|---|
| `POST /books` | `201` + kniha, `id` od 1 (auto-increment, **nerecykluje se**), `tags` default `[]` | `400` validace, `409` ISBN už existuje |
| `GET /books?author=` | `200` pole v pořadí vložení; `author` volitelný, porovnání **case-insensitive** (celé jméno) | |
| `GET /books/:id` | `200` kniha | `400` id není číslo, `404` neexistuje |
| `PATCH /books/:id` | `200` aktualizovaná kniha — mění **jen poslaná pole** | `400` validace / pole navíc (včetně `id`), `404`, `409` ISBN patří **jiné** knize |
| `DELETE /books/:id` | `204` bez těla | `404` |

Validace `CreateBookDto`:

- `title` — string, 1–200 znaků
- `author` — string, 1–100 znaků
- `isbn` — přesně 13 číslic (`/^\d{13}$/`)
- `year` — celé číslo 1450–2100 (string `"1965"` je chyba)
- `tags` — volitelné, pole stringů

`UpdateBookDto` — stejná pravidla, všechna pole volitelná.

`BooksService` musí být **exportovaný** — test ho injektuje z jiného modulu.

## Na co interviewer kouká

- Logika (409, 404, partial update) je v **service**, controller jen deleguje.
- DTO je **třída** s dekorátory; Update přes `PartialType`, ne copy-paste.
- `ParseIntPipe` (nebo `transform`) na `:id` — `"1" !== 1` v `Map`.
- `@HttpCode(204)` u DELETE.
- PATCH s vlastním ISBN není konflikt (pozor na `exceptId`).
- Co bys změnil s reálnou DB? (unikátní index místo smyčky, `409` z chyby
  constraintu, transakce) — řekni to nahlas, i když to nepíšeš.

Vzorové řešení: `solution/books/` (stejné testy, zelené) — **dívej se až po pokusu**:

```bash
npx jest lessons/D4-nest-basics/exercise/solution
```

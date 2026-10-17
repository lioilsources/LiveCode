# Exercise D2 — generický in-memory repozitář

**Čas: 40 min.** Tohle je přesně ta vrstva, kterou na Nest live codingu napíšeš
pod službu, když „databázi nepotřebujeme, stačí paměť".

## Zadání — `repository.ts`

`class InMemoryRepository<T extends { id: string }>`:

| Metoda | Chování |
|---|---|
| `constructor(idGen: () => string)` | generátor id se injektuje (testovatelnost!) — parameter property |
| `create(data: Omit<T, 'id'>): T` | přidělí id přes `idGen`, uloží, vrátí **kopii** |
| `findById(id): T \| undefined` | |
| `getById(id): T` | neexistuje → `throw new NotFoundError(id)` |
| `update(id, patch: Partial<Omit<T, 'id'>>): T` | merge; klíče s `undefined` **ignoruj**; neexistuje → `NotFoundError`; `id` se nemění |
| `delete(id): boolean` | `true`, když něco smazal |
| `findBy(where: Partial<T>): T[]` | všechny entity, kde **každé** pole z `where` je `===` |
| `list(opts?: ListOptions<T>): Page<T>` | řazení `sortBy`/`dir`, pak `offset` (default 0) a `limit` (default 20); `total` = počet před stránkováním |

`NotFoundError extends Error` — `name = 'NotFoundError'`, `public readonly id`,
message `"entity <id> not found"`.

Repozitář **nesmí vracet referenci na interní stav**: mutace vráceného objektu
nesmí změnit uložená data (stačí mělká kopie `{ ...x }`).

## Zadání — `stats.ts`

`topCustomers(orders, k)` — sečti `total` objednávek se `status === 'paid'` podle
`customerId`, vrať top `k` jako `{ customerId, revenue }[]`, seřazené podle
`revenue` sestupně, při shodě podle `customerId` vzestupně.

```bash
npx jest lessons/D2-generics-utility-errors/exercise
```

## Co sleduje interviewer

- Constraint `T extends { id: string }` a `Omit<T, 'id'>` / `Partial<…>` místo `any`.
- Žádné `as any`. (Jedno `as T` při skládání `{ ...data, id }` je OK — vysvětli proč:
  TS neumí dokázat, že `Omit<T,'id'> & {id}` je `T`.)
- Kopie na výstupu, `toSorted` místo mutujícího `sort`.
- `findBy` přes `Object.entries(where).every(...)`.

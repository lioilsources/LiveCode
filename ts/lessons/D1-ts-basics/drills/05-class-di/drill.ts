// DRILL 05 — třídy, parameter properties, implements (tvar Nest služby)
//
// Napiš a exportuj:
//
//  1. interface Todo { id: number; title: string; done: boolean }
//  2. interface TodoRepo {
//       findById(id: number): Todo | undefined;
//       save(todo: Todo): void;
//       all(): Todo[];
//     }
//  3. class InMemoryTodoRepo implements TodoRepo — data v private Map<number, Todo>
//  4. class TodoService
//       constructor(private readonly repo: TodoRepo)      ← parameter property!
//       create(title: string): Todo        id = 1, 2, 3… (private čítač), done: false
//       complete(id: number): Todo         neexistuje → throw new Error(`todo ${id} not found`)
//       pending(): Todo[]                  jen done === false
//
// Sval: `constructor(private readonly x: X) {}`, `implements`, `private items = new Map<..>()`.
//
//   npx jest lessons/D1-ts-basics/drills/05

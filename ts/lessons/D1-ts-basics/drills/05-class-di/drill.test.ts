import { InMemoryTodoRepo, TodoService, type TodoRepo } from './drill';

describe('drill 05 — class + DI', () => {
  let repo: TodoRepo;
  let svc: TodoService;

  beforeEach(() => {
    repo = new InMemoryTodoRepo();
    svc = new TodoService(repo);
  });

  it('create přiděluje id', () => {
    expect(svc.create('a')).toEqual({ id: 1, title: 'a', done: false });
    expect(svc.create('b').id).toBe(2);
    expect(repo.all()).toHaveLength(2);
  });

  it('complete + pending', () => {
    svc.create('a');
    svc.create('b');
    expect(svc.complete(1).done).toBe(true);
    expect(svc.pending().map((t) => t.title)).toEqual(['b']);
  });

  it('complete neexistujícího hodí', () => {
    expect(() => svc.complete(42)).toThrow('todo 42 not found');
  });

  it('service jde otestovat s fake repem (structural typing)', () => {
    const saved: unknown[] = [];
    const fake: TodoRepo = { findById: () => undefined, save: (t) => void saved.push(t), all: () => [] };
    new TodoService(fake).create('x');
    expect(saved).toHaveLength(1);
  });
});

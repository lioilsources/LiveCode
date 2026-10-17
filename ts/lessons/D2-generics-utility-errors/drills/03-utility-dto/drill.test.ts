import { applyUpdate, createArticle, summarize, type Article, type CreateArticle, type UpdateArticle } from './drill';

describe('drill 03 — utility types', () => {
  const dto: CreateArticle = { title: 'Hello', body: 'World', tags: ['ts'] };

  it('typy', () => {
    // @ts-expect-error — CreateArticle nemá id
    const bad: CreateArticle = { id: 'x', title: 't', body: 'b', tags: [] };
    const patch: UpdateArticle = {}; // všechno nepovinné
    expect(bad && patch).toBeDefined();
  });

  it('createArticle', () => {
    expect(createArticle(dto, 'a1')).toEqual({ id: 'a1', title: 'Hello', body: 'World', tags: ['ts'], publishedAt: null });
  });

  it('applyUpdate ignoruje undefined a nemutuje', () => {
    const a = createArticle(dto, 'a1');
    const u = applyUpdate(a, { title: 'Hi', body: undefined });
    expect(u).toEqual({ ...a, title: 'Hi' });
    expect(a.title).toBe('Hello');
    expect(u.tags).not.toBe(a.tags);
    u.tags.push('x');
    expect(a.tags).toEqual(['ts']);
  });

  it('summarize', () => {
    const items: Article[] = [createArticle(dto, 'a1'), createArticle({ ...dto, title: 'Second' }, 'a2')];
    expect(summarize(items)).toEqual([
      { id: 'a1', title: 'Hello' },
      { id: 'a2', title: 'Second' },
    ]);
  });
});

import { canEdit, label, type Role, type User } from './drill';

describe('drill 01 — interface & type', () => {
  const ann: User = { id: '1', name: 'Ann', role: 'admin' };
  const bob: User = { id: '2', name: 'Bob', role: 'viewer', email: 'bob@x.cz' };

  it('label bez emailu', () => expect(label(ann)).toBe('Ann (admin)'));
  it('label s emailem', () => expect(label(bob)).toBe('Bob (viewer) bob@x.cz'));

  it('canEdit', () => {
    const roles: Role[] = ['admin', 'editor', 'viewer'];
    expect(roles.map((role) => canEdit({ id: 'x', name: 'x', role }))).toEqual([true, true, false]);
  });

  it('Role je union literálů (compile-time)', () => {
    // @ts-expect-error — 'owner' není Role
    const bad: Role = 'owner';
    expect(bad).toBe('owner');
  });
});

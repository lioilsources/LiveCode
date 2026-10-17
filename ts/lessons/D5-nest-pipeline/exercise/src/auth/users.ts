export interface User {
  id: string;
  name: string;
}

// API klíč → uživatel (v reálu tabulka / secret manager)
export const API_KEYS: Readonly<Record<string, User>> = {
  'key-alice': { id: 'u1', name: 'alice' },
  'key-bob': { id: 'u2', name: 'bob' },
};

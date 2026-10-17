// DANÉ — doménový typ. Neměň.
export const ROLES = ['admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

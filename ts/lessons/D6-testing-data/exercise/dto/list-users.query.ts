import { Role } from '../user';

// TODO: dekorátory — page (int >= 1), limit (int 1..100), role (jen ROLES).
// Všechno volitelné. Z URL přichází string → @Type(() => Number).
export class ListUsersQuery {
  page: number = 1;
  limit: number = 10;
  role?: Role;
}

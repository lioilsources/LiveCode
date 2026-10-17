import { Role } from '../user';

// TODO: dekorátory — name (neprázdný string, max 100), email (validní email), role (jen ROLES)
export class CreateUserDto {
  name!: string;
  email!: string;
  role!: Role;
}

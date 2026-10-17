import { Injectable } from '@nestjs/common';
import { Role, User } from './user';

export interface FindPageParams {
  role?: Role;
  offset: number;
  limit: number;
}

// DANÉ — kontrakt. Abstraktní třída = DI token (interface za běhu neexistuje).
// V produkci by vedle byla TypeOrmUsersRepository / PrismaUsersRepository.
export abstract class UsersRepository {
  abstract findPage(params: FindPageParams): Promise<{ items: User[]; total: number }>;
  abstract findById(id: number): Promise<User | undefined>;
  abstract findByEmail(email: string): Promise<User | undefined>;
  abstract create(data: Omit<User, 'id'>): Promise<User>;
}

// TODO: in-memory implementace (Map<number, User>, id od 1, pořadí podle id)
@Injectable()
export class InMemoryUsersRepository extends UsersRepository {
  async findPage(_params: FindPageParams): Promise<{ items: User[]; total: number }> {
    throw new Error('TODO');
  }

  async findById(_id: number): Promise<User | undefined> {
    throw new Error('TODO');
  }

  async findByEmail(_email: string): Promise<User | undefined> {
    throw new Error('TODO');
  }

  async create(_data: Omit<User, 'id'>): Promise<User> {
    throw new Error('TODO');
  }
}

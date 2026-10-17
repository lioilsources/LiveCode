import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQuery } from './dto/list-users.query';
import { Page, User } from './user';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  // TODO: page/limit → offset; zavolej repo.findPage a vrať Page<User>
  async list(_q: ListUsersQuery): Promise<Page<User>> {
    throw new Error('TODO');
  }

  // TODO: neexistuje → NotFoundException
  async getById(_id: number): Promise<User> {
    throw new Error('TODO');
  }

  // TODO: email trim + lowercase; obsazený → ConflictException; jinak repo.create
  async create(_dto: CreateUserDto): Promise<User> {
    throw new Error('TODO');
  }
}

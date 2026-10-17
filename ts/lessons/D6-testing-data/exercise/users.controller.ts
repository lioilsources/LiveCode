import { Controller } from '@nestjs/common';

// TODO:
//   GET  /users        → UsersService.list   (@Query() ListUsersQuery)
//   GET  /users/:id    → UsersService.getById (ParseIntPipe)
//   POST /users        → UsersService.create  (@Body() CreateUserDto) → 201
@Controller('users')
export class UsersController {}

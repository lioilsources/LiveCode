// DRILL 04 — DTO + class-validator + PartialType
//
// Test zapne globální ValidationPipe({ whitelist, forbidNonWhitelisted, transform }).
//
// Napiš a exportuj:
//
//  1. CreateUserDto:
//     - email: platný e-mail
//     - name:  string délky 2–50
//     - age?:  volitelný, celé číslo ≥ 0
//  2. UpdateUserDto = všechna pole volitelná, validace zachovaná
//  3. UsersController (prefix 'users'):
//     - POST  /users      → { ...dto, isDto: dto instanceof CreateUserDto }
//     - PATCH /users/:id  → { id, ...dto }   — id jako number (díky transform)
//  4. UsersModule
//
// Sval: class (ne interface!), @IsEmail/@IsString/@Length/@IsOptional/@IsInt/@Min,
//       `name!: string`, extends PartialType(CreateUserDto) z '@nestjs/mapped-types'
//
//   npx jest lessons/D4-nest-basics/drills/04

// Example 03 — DTO + ValidationPipe: whitelist, forbidNonWhitelisted, transform,
// PartialType, a past "@Param('id') id: number je pořád string".
//
//   npm run ex:nest lessons/D4-nest-basics/examples/03-validation-pipes.ts
import 'reflect-metadata';
import { Body, Controller, Get, Module, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

class CreateBookDto {
  @IsString() @Length(1, 200)
  title!: string;

  @Matches(/^\d{13}$/, { message: 'isbn must be 13 digits' })
  isbn!: string;

  @IsInt() @Min(1450) @Max(2100)
  year!: number;

  @IsOptional() @IsString()
  author?: string;
}

class UpdateBookDto extends PartialType(CreateBookDto) {}

@Controller('books')
class BooksController {
  @Post()
  create(@Body() dto: CreateBookDto) {
    return { isInstance: dto instanceof CreateBookDto, dto };
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateBookDto) {
    // bez transform je id string, i když anotace říká number
    return { id, typeofId: typeof id, dto };
  }
}

@Module({ controllers: [BooksController] })
class AppModule {}

const valid = { title: 'Dune', isbn: '9780441013593', year: 1965 };

async function run(label: string, pipe: ValidationPipe | null) {
  const app = await NestFactory.create(AppModule, { logger: false });
  if (pipe) app.useGlobalPipes(pipe);
  await app.listen(0);
  const base = await app.getUrl();
  const send = async (method: string, path: string, body: unknown) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`  ${method} ${path} → ${res.status} ${await res.text()}`);
  };

  console.log(`\n### ${label}`);
  await send('POST', '/books', { ...valid, role: 'admin' }); // pole navíc
  await send('POST', '/books', { title: '', isbn: '123', year: 1965.5 }); // nevalidní
  await send('PATCH', '/books/42', { year: 2000 }); // partial update
  await send('PATCH', '/books/42', { year: 'x' }); // partial, ale validní musí být
  await app.close();
}

async function main() {
  await run('bez ValidationPipe — dekorátory nic nedělají', null);
  await run('whitelist', new ValidationPipe({ whitelist: true }));
  await run(
    'whitelist + forbidNonWhitelisted + transform',
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
}

main();

/* Výstup:

### bez ValidationPipe — dekorátory nic nedělají
  POST /books → 201 {"isInstance":false,"dto":{"title":"Dune","isbn":"9780441013593","year":1965,"role":"admin"}}
  POST /books → 201 {"isInstance":false,"dto":{"title":"","isbn":"123","year":1965.5}}
  PATCH /books/42 → 200 {"id":"42","typeofId":"string","dto":{"year":2000}}
  PATCH /books/42 → 200 {"id":"42","typeofId":"string","dto":{"year":"x"}}

### whitelist
  POST /books → 201 {"isInstance":false,"dto":{"title":"Dune","isbn":"9780441013593","year":1965}}
  POST /books → 400 {"message":["title must be longer than or equal to 1 characters","isbn must be 13 digits","year must be an integer number"],"error":"Bad Request","statusCode":400}
  PATCH /books/42 → 200 {"id":"42","typeofId":"string","dto":{"year":2000}}
  PATCH /books/42 → 400 {"message":["year must not be greater than 2100","year must not be less than 1450","year must be an integer number"],"error":"Bad Request","statusCode":400}

### whitelist + forbidNonWhitelisted + transform
  POST /books → 400 {"message":["property role should not exist"],"error":"Bad Request","statusCode":400}
  POST /books → 400 {"message":["title must be longer than or equal to 1 characters","isbn must be 13 digits","year must be an integer number"],"error":"Bad Request","statusCode":400}
  PATCH /books/42 → 200 {"id":42,"typeofId":"number","dto":{"year":2000}}
  PATCH /books/42 → 400 {"message":["year must not be greater than 2100","year must not be less than 1450","year must be an integer number"],"error":"Bad Request","statusCode":400}
*/

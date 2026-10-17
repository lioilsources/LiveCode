// Example 01 — minimální tvar: Module → Controller → Service.
//
//   npm run ex:nest lessons/D4-nest-basics/examples/01-module-controller-service.ts
//
// Ukazuje: DI přes konstruktor, návratová hodnota → JSON, 201 u POST,
// @HttpCode(204), NotFoundException → 404, neošetřená chyba → 500.
import 'reflect-metadata';
import {
  Body, Controller, Delete, Get, HttpCode, Injectable, Module,
  NotFoundException, Param, ParseIntPipe, Post,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

interface Book {
  id: number;
  title: string;
}

@Injectable()
class BooksService {
  private readonly books = new Map<number, Book>();
  private nextId = 1;

  findAll(): Book[] {
    return [...this.books.values()];
  }

  findOne(id: number): Book {
    const book = this.books.get(id);
    if (!book) throw new NotFoundException(`book ${id} not found`);
    return book;
  }

  create(title: string): Book {
    const book = { id: this.nextId++, title };
    this.books.set(book.id, book);
    return book;
  }

  remove(id: number): void {
    if (!this.books.delete(id)) throw new NotFoundException(`book ${id} not found`);
  }
}

@Controller('books')
class BooksController {
  // parameter property + DI: Nest přečte design:paramtypes = [BooksService]
  constructor(private readonly books: BooksService) {}

  @Get()
  findAll() {
    return this.books.findAll();
  }

  @Get('boom') // statická cesta PŘED ':id'
  boom() {
    throw new Error('db password is hunter2'); // detail se klientovi neukáže
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.books.findOne(id);
  }

  @Post()
  create(@Body() body: { title: string }) {
    return this.books.create(body.title);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.books.remove(id);
  }
}

@Module({ controllers: [BooksController], providers: [BooksService] })
class BooksModule {}

@Module({ imports: [BooksModule] })
class AppModule {}

async function call(base: string, method: string, path: string, body?: unknown) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`${method.padEnd(6)} ${path.padEnd(12)} → ${res.status} ${text}`);
}

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0); // 0 = náhodný volný port
  const base = await app.getUrl();

  await call(base, 'POST', '/books', { title: 'Dune' });
  await call(base, 'POST', '/books', { title: 'Hyperion' });
  await call(base, 'GET', '/books');
  await call(base, 'GET', '/books/1');
  await call(base, 'GET', '/books/99');
  await call(base, 'GET', '/books/abc');
  await call(base, 'DELETE', '/books/1');
  await call(base, 'GET', '/books');
  await call(base, 'GET', '/books/boom');

  await app.close();
}

main();

/* Výstup:
POST   /books       → 201 {"id":1,"title":"Dune"}
POST   /books       → 201 {"id":2,"title":"Hyperion"}
GET    /books       → 200 [{"id":1,"title":"Dune"},{"id":2,"title":"Hyperion"}]
GET    /books/1     → 200 {"id":1,"title":"Dune"}
GET    /books/99    → 404 {"message":"book 99 not found","error":"Not Found","statusCode":404}
GET    /books/abc   → 400 {"message":"Validation failed (numeric string is expected)","error":"Bad Request","statusCode":400}
DELETE /books/1     → 204 
GET    /books       → 200 [{"id":2,"title":"Hyperion"}]
GET    /books/boom  → 500 {"statusCode":500,"message":"Internal server error"}
*/

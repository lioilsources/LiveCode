import { Controller } from '@nestjs/common';
import { Book } from './book.entity';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

// TODO: routing dekorátory, @Param + pipe, @Query, @Body, @HttpCode
@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  // GET /books?author=
  findAll(author?: string): Book[] {
    throw new Error('TODO');
  }

  // GET /books/:id
  findOne(id: number): Book {
    throw new Error('TODO');
  }

  // POST /books
  create(dto: CreateBookDto): Book {
    throw new Error('TODO');
  }

  // PATCH /books/:id
  update(id: number, dto: UpdateBookDto): Book {
    throw new Error('TODO');
  }

  // DELETE /books/:id
  remove(id: number): void {
    throw new Error('TODO');
  }
}

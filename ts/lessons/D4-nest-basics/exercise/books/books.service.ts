import { Injectable } from '@nestjs/common';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  // TODO: úložiště (Map) + generátor id

  findAll(author?: string): Book[] {
    throw new Error('TODO');
  }

  findOne(id: number): Book {
    throw new Error('TODO');
  }

  create(dto: CreateBookDto): Book {
    throw new Error('TODO');
  }

  update(id: number, dto: UpdateBookDto): Book {
    throw new Error('TODO');
  }

  remove(id: number): void {
    throw new Error('TODO');
  }
}

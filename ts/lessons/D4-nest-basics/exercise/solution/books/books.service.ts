import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  private readonly books = new Map<number, Book>();
  private nextId = 1;

  findAll(author?: string): Book[] {
    const all = [...this.books.values()];
    if (!author) return all;
    const needle = author.toLowerCase();
    return all.filter((b) => b.author.toLowerCase() === needle);
  }

  findOne(id: number): Book {
    const book = this.books.get(id);
    if (!book) throw new NotFoundException(`book ${id} not found`);
    return book;
  }

  create(dto: CreateBookDto): Book {
    this.assertIsbnFree(dto.isbn);
    const book: Book = {
      id: this.nextId++,
      title: dto.title,
      author: dto.author,
      isbn: dto.isbn,
      year: dto.year,
      tags: dto.tags ?? [],
    };
    this.books.set(book.id, book);
    return book;
  }

  update(id: number, dto: UpdateBookDto): Book {
    const book = this.findOne(id);
    if (dto.isbn !== undefined) this.assertIsbnFree(dto.isbn, id);
    const updated: Book = {
      ...book,
      title: dto.title ?? book.title,
      author: dto.author ?? book.author,
      isbn: dto.isbn ?? book.isbn,
      year: dto.year ?? book.year,
      tags: dto.tags ?? book.tags,
    };
    this.books.set(id, updated);
    return updated;
  }

  remove(id: number): void {
    if (!this.books.delete(id)) throw new NotFoundException(`book ${id} not found`);
  }

  private assertIsbnFree(isbn: string, exceptId?: number): void {
    for (const b of this.books.values()) {
      if (b.isbn === isbn && b.id !== exceptId) {
        throw new ConflictException(`isbn ${isbn} already exists`);
      }
    }
  }
}

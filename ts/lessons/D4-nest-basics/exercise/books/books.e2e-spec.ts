import 'reflect-metadata';
import { INestApplication, Injectable, Module, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BooksModule } from './books.module';
import { BooksService } from './books.service';

const dune = {
  title: 'Dune',
  author: 'Frank Herbert',
  isbn: '9780441013593',
  year: 1965,
};
const hyperion = {
  title: 'Hyperion',
  author: 'Dan Simmons',
  isbn: '9780553283686',
  year: 1989,
  tags: ['sci-fi', 'classic'],
};

describe('BooksModule (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({ imports: [BooksModule] }).compile();
    app = mod.createNestApplication();
    // stejně jako v main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    http = request(app.getHttpServer());
  });
  afterEach(() => app.close());

  describe('POST /books', () => {
    it('201 + id od 1, tags default []', async () => {
      const res = await http.post('/books').send(dune).expect(201);
      expect(res.body).toEqual({ id: 1, ...dune, tags: [] });
      const res2 = await http.post('/books').send(hyperion).expect(201);
      expect(res2.body).toEqual({ id: 2, ...hyperion });
    });

    it('409 při duplicitním ISBN', async () => {
      await http.post('/books').send(dune).expect(201);
      await http.post('/books').send({ ...dune, title: 'Dune (reprint)' }).expect(409);
    });

    it.each([
      ['prázdný title', { ...dune, title: '' }],
      ['title > 200 znaků', { ...dune, title: 'x'.repeat(201) }],
      ['chybí author', { title: dune.title, isbn: dune.isbn, year: dune.year }],
      ['isbn není 13 číslic', { ...dune, isbn: '978-0441013593' }],
      ['year není int', { ...dune, year: 1965.5 }],
      ['year < 1450', { ...dune, year: 1200 }],
      ['year jako string', { ...dune, year: '1965' }],
      ['tags není pole stringů', { ...dune, tags: [1, 2] }],
      ['pole navíc', { ...dune, price: 10 }],
    ])('400: %s', (_label, body) => http.post('/books').send(body).expect(400));
  });

  describe('GET', () => {
    beforeEach(async () => {
      await http.post('/books').send(dune).expect(201);
      await http.post('/books').send(hyperion).expect(201);
    });

    it('GET /books vrací všechny', async () => {
      const res = await http.get('/books').expect(200);
      expect(res.body.map((b: { id: number }) => b.id)).toEqual([1, 2]);
    });

    it('GET /books?author= filtruje case-insensitive', async () => {
      const res = await http.get('/books?author=dan%20simmons').expect(200);
      expect(res.body).toEqual([{ id: 2, ...hyperion }]);
    });

    it('GET /books/:id', () => http.get('/books/1').expect(200, { id: 1, ...dune, tags: [] }));
    it('GET /books/99 → 404', () => http.get('/books/99').expect(404));
    it('GET /books/abc → 400', () => http.get('/books/abc').expect(400));
  });

  describe('PATCH /books/:id', () => {
    beforeEach(async () => {
      await http.post('/books').send(dune).expect(201);
      await http.post('/books').send(hyperion).expect(201);
    });

    it('mění jen poslaná pole', async () => {
      await http
        .patch('/books/1')
        .send({ year: 1966, tags: ['desert'] })
        .expect(200, { id: 1, ...dune, year: 1966, tags: ['desert'] });
      await http.get('/books/1').expect(200, { id: 1, ...dune, year: 1966, tags: ['desert'] });
    });

    it('id nejde přepsat tělem (není v DTO → 400)', () =>
      http.patch('/books/1').send({ id: 5 }).expect(400));

    it('validuje přítomná pole', () => http.patch('/books/1').send({ year: 'x' }).expect(400));

    it('409, když nové ISBN patří jiné knize', () =>
      http.patch('/books/1').send({ isbn: hyperion.isbn }).expect(409));

    it('vlastní ISBN poslat znovu je OK', () =>
      http.patch('/books/1').send({ isbn: dune.isbn }).expect(200));

    it('404 pro neexistující', () => http.patch('/books/99').send({ year: 2000 }).expect(404));
  });

  describe('DELETE /books/:id', () => {
    it('204, pak 404', async () => {
      await http.post('/books').send(dune).expect(201);
      const res = await http.delete('/books/1').expect(204);
      expect(res.text).toBe('');
      await http.get('/books/1').expect(404);
      await http.delete('/books/1').expect(404);
    });

    it('po smazání jde ISBN použít znovu a id se nerecykluje', async () => {
      await http.post('/books').send(dune).expect(201);
      await http.delete('/books/1').expect(204);
      const res = await http.post('/books').send(dune).expect(201);
      expect(res.body.id).toBe(2);
    });
  });

  it('BooksService je exportovaný (jiný modul ho může injektovat)', async () => {
    @Injectable()
    class Shelf {
      constructor(readonly books: BooksService) {}
    }
    @Module({ imports: [BooksModule], providers: [Shelf] })
    class ShelfModule {}

    const mod = await Test.createTestingModule({ imports: [ShelfModule] }).compile();
    expect(mod.get(Shelf).books).toBeInstanceOf(BooksService);
  });
});

describe('BooksService (unit — bez HTTP)', () => {
  it('create + findOne + NotFound', () => {
    const svc = new BooksService();
    const b = svc.create({ ...dune });
    expect(svc.findOne(b.id)).toEqual(b);
    expect(() => svc.findOne(42)).toThrow('book 42 not found');
  });
});

// EXAMPLE 02 — unit test Nest service: abstract class jako DI token + mock repozitáře
//
//   npx jest lessons/D6-testing-data/examples/02
//
// Vše v jednom souboru, aby se to dalo číst naráz. V reálném projektu:
// users.repository.ts / users.service.ts / users.service.spec.ts.
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

interface User {
  id: number;
  email: string;
}

// --- kontrakt: abstraktní třída EXISTUJE za běhu → může být DI token ---------
abstract class UsersRepository {
  abstract findById(id: number): Promise<User | undefined>;
  abstract findByEmail(email: string): Promise<User | undefined>;
  abstract create(email: string): Promise<User>;
}

// --- implementace č. 1: in-memory (testy, prototyp, live coding) -------------
@Injectable()
class InMemoryUsersRepository extends UsersRepository {
  private readonly rows = new Map<number, User>();
  private nextId = 1;

  async findById(id: number) {
    return this.rows.get(id);
  }
  async findByEmail(email: string) {
    return [...this.rows.values()].find((u) => u.email === email);
  }
  async create(email: string) {
    const user = { id: this.nextId++, email };
    this.rows.set(user.id, user);
    return user;
  }
}

// --- service závisí na KONTRAKTU, ne na implementaci --------------------------
@Injectable()
class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async getById(id: number): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`user ${id} not found`);
    return user;
  }

  async register(email: string): Promise<User> {
    if (await this.repo.findByEmail(email)) throw new ConflictException('email taken');
    return this.repo.create(email);
  }
}

// ============================================================================

describe('UsersService (mock repozitáře přes useValue)', () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: repo }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('getById vrátí uživatele', async () => {
    repo.findById.mockResolvedValue({ id: 1, email: 'a@x.cz' });
    await expect(service.getById(1)).resolves.toEqual({ id: 1, email: 'a@x.cz' });
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('getById → NotFoundException (doménová chyba = HTTP 404)', async () => {
    repo.findById.mockResolvedValue(undefined);
    await expect(service.getById(42)).rejects.toThrow(NotFoundException);
  });

  it('register s obsazeným emailem → ConflictException a create se NEvolá', async () => {
    repo.findByEmail.mockResolvedValue({ id: 1, email: 'a@x.cz' });
    await expect(service.register('a@x.cz')).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe('UsersService (bez mocku — skutečná in-memory implementace)', () => {
  it('stejný service, jiná implementace kontraktu', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useClass: InMemoryUsersRepository }],
    }).compile();
    const service = moduleRef.get(UsersService);

    const u = await service.register('b@x.cz');
    await expect(service.getById(u.id)).resolves.toEqual(u);
    await expect(service.register('b@x.cz')).rejects.toThrow(ConflictException);
  });

  it('a nejjednodušší varianta: obyčejné new (žádný Nest kontejner)', async () => {
    const service = new UsersService(new InMemoryUsersRepository());
    await expect(service.getById(1)).rejects.toThrow(NotFoundException);
  });
});

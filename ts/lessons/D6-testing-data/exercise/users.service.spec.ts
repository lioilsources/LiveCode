import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ListUsersQuery } from './dto/list-users.query';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { User } from './user';

function query(q: Partial<ListUsersQuery>): ListUsersQuery {
  return Object.assign(new ListUsersQuery(), q);
}

const olda: User = { id: 1, name: 'Olda', email: 'olda@x.cz', role: 'admin' };

describe('UsersService (unit)', () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    repo = {
      findPage: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('list', () => {
    it('přepočítá page/limit na offset a vrátí Page', async () => {
      repo.findPage.mockResolvedValue({ items: [olda], total: 31 });

      const got = await service.list(query({ page: 3, limit: 10, role: 'admin' }));

      expect(repo.findPage).toHaveBeenCalledWith({ role: 'admin', offset: 20, limit: 10 });
      expect(got).toEqual({ items: [olda], total: 31, page: 3, limit: 10 });
    });

    it('defaulty z DTO (page=1, limit=10) → offset 0', async () => {
      repo.findPage.mockResolvedValue({ items: [], total: 0 });
      await service.list(new ListUsersQuery());
      expect(repo.findPage).toHaveBeenCalledWith({ role: undefined, offset: 0, limit: 10 });
    });
  });

  describe('getById', () => {
    it('vrátí uživatele', async () => {
      repo.findById.mockResolvedValue(olda);
      await expect(service.getById(1)).resolves.toBe(olda);
    });

    it('neexistuje → NotFoundException', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.getById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('normalizuje email (trim + lowercase) a uloží', async () => {
      repo.findByEmail.mockResolvedValue(undefined);
      repo.create.mockImplementation(async (d) => ({ id: 5, ...d }));

      const got = await service.create({ name: 'Eva', email: '  Eva@X.cz ', role: 'member' });

      expect(repo.findByEmail).toHaveBeenCalledWith('eva@x.cz');
      expect(repo.create).toHaveBeenCalledWith({ name: 'Eva', email: 'eva@x.cz', role: 'member' });
      expect(got.id).toBe(5);
    });

    it('obsazený email → ConflictException a create se nevolá', async () => {
      repo.findByEmail.mockResolvedValue(olda);
      await expect(service.create({ name: 'X', email: 'OLDA@x.cz', role: 'member' })).rejects.toThrow(
        ConflictException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});

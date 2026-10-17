export class NotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`entity ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export interface ListOptions<T> {
  sortBy?: keyof T;
  dir?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export class InMemoryRepository<T extends { id: string }> {
  private readonly items = new Map<string, T>();

  constructor(private readonly idGen: () => string) {}

  create(data: Omit<T, 'id'>): T {
    throw new Error('TODO');
  }

  findById(id: string): T | undefined {
    throw new Error('TODO');
  }

  getById(id: string): T {
    throw new Error('TODO');
  }

  update(id: string, patch: Partial<Omit<T, 'id'>>): T {
    throw new Error('TODO');
  }

  delete(id: string): boolean {
    throw new Error('TODO');
  }

  findBy(where: Partial<T>): T[] {
    throw new Error('TODO');
  }

  list(opts: ListOptions<T> = {}): Page<T> {
    throw new Error('TODO');
  }
}

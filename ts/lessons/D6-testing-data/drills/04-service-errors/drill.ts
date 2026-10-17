// DRILL 04 — service s injektovaným repozitářem + doménové chyby
//
// Napiš (z prázdné stránky):
//
//  1. export interface Product { id: number; sku: string; name: string }
//  2. export abstract class ProductsRepository
//       findById(id: number): Promise<Product | undefined>
//       findBySku(sku: string): Promise<Product | undefined>
//       save(data: Omit<Product, 'id'>): Promise<Product>
//  3. @Injectable() export class ProductsService
//       - constructor injection repozitáře (parameter property!)
//       - getById(id): Promise<Product>        → neexistuje? NotFoundException
//       - create(data): Promise<Product>       → sku existuje? ConflictException
//
// Sval: constructor(private readonly repo: ProductsRepository) {} a házení
// HTTP výjimek z @nestjs/common přímo ze service.
//
//   npx jest lessons/D6-testing-data/drills/04

// DRILL 03 — abstraktní třída jako DI token + in-memory implementace
//
// Napiš (z prázdné stránky):
//
//  1. export interface Product { id: number; sku: string; name: string }
//  2. export abstract class ProductsRepository s abstraktními metodami:
//       findById(id: number): Promise<Product | undefined>
//       findAll(): Promise<Product[]>
//       save(data: Omit<Product, 'id'>): Promise<Product>
//  3. export class InMemoryProductsRepository extends ProductsRepository
//       - @Injectable()
//       - data v Map<number, Product>, id od 1
//
// Proč abstract class a ne interface? Interface za běhu neexistuje → nemůže
// být DI token. Abstraktní třída ano.
//
//   npx jest lessons/D6-testing-data/drills/03

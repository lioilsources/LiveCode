// DRILL 02 — query DTO se stránkováním a filtrem
//
// Napiš (z prázdné stránky):
//
//   export class ListQueryDto
//     page   — volitelné, celé číslo >= 1, default 1
//     limit  — volitelné, celé číslo 1..100, default 20
//     role   — volitelné, jen 'admin' | 'member'
//     search — volitelný string, max 50 znaků
//
// Pamatuj: z URL přichází VŽDY string → @Type(() => Number) z class-transformer.
// Default = inicializátor pole (`page: number = 1`).
//
// Sval: @IsOptional @Type @IsInt @Min @Max @IsIn @IsString @MaxLength
//
//   npx jest lessons/D6-testing-data/drills/02

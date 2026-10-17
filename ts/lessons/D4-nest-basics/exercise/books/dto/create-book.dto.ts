// TODO: doplň validační dekorátory z 'class-validator' (viz exercise/README.md):
//   title  1–200 znaků, author 1–100 znaků, isbn přesně 13 číslic,
//   year celé číslo 1450–2100, tags volitelné pole stringů
export class CreateBookDto {
  title!: string;
  author!: string;
  isbn!: string;
  year!: number;
  tags?: string[];
}

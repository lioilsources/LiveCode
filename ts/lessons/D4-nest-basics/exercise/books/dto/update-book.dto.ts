// TODO: všechna pole CreateBookDto volitelná, validace zachovaná
//       (nápověda: '@nestjs/mapped-types')
export class UpdateBookDto {
  title?: string;
  author?: string;
  isbn?: string;
  year?: number;
  tags?: string[];
}

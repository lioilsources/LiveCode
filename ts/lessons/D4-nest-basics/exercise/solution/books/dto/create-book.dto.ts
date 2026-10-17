import { IsArray, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsString()
  @Length(1, 100)
  author!: string;

  @Matches(/^\d{13}$/, { message: 'isbn must be 13 digits' })
  isbn!: string;

  @IsInt()
  @Min(1450)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

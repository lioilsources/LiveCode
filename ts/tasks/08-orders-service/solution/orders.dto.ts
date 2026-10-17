import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true }) // bez toho se vnořené objekty NEvalidují
  @Type(() => OrderItemDto) // a bez toho to nejsou instance OrderItemDto
  items!: OrderItemDto[];
}

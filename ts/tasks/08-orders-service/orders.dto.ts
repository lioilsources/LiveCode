// TODO: validace — sku neprázdný string, qty celé číslo ≥ 1,
//       items neprázdné pole, vnořené položky se musí validovat taky.
export class OrderItemDto {
  sku!: string;
  qty!: number;
}

export class CreateOrderDto {
  items!: OrderItemDto[];
}

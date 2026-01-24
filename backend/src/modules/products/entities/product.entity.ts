import { ApiProperty } from "@nestjs/swagger";

export class Product {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number

    @ApiProperty({ required: false, nullable: true })
    description: string;

    @ApiProperty({ example: 'https://example.com/images/pho_bo.jpg', description: 'The URL of the product image.' })
    image: string;

    @ApiProperty({ example: 100, description: 'The available quantity of the product in stock.' })
    quantity: number;

    @ApiProperty({ example: 1, description: 'The category ID to which the product belongs.' })
    categoryId: number;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'The date and time when the product was created.' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-02T00:00:00.000Z', description: 'The date and time when the product was last updated.' })
    updatedAt: Date;
}

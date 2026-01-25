import { ApiProperty } from "@nestjs/swagger";

export class Table {
    @ApiProperty()
    id: number;

    @ApiProperty()
    number: string;
}

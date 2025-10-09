import { ApiProperty } from '@nestjs/swagger';

export class GenreEntity {
  @ApiProperty({
    description: 'Genre ID',
    example: 'cmggcnozu000et7rfi1pvw6tn',
  })
  id: string;

  @ApiProperty({ description: 'Genre Name', example: 'Fiction' })
  name: string;

  @ApiProperty({ description: 'Genre Key Name', example: 'fiction' })
  keyName: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class BookEntity {
  @ApiProperty({ description: 'Book title', example: 'Book 1' })
  title: string;
  @ApiProperty({ description: 'Book Author', example: 'Author 1' })
  author: string;
  @ApiProperty({ description: 'Book Published Year', example: 2020 })
  published: number;
  @ApiProperty({
    description: 'Book Genre Id',
    example: 'cmggcnozu000et7rfi1pvw6tn',
  })
  genreId: string;
}

export class BookResponse {
  @ApiProperty({ description: 'Book ID', example: 'fdasfdssd' })
  id: string;
  @ApiProperty({ description: 'Book title', example: 'Book 1' })
  title: string;
  @ApiProperty({ description: 'Book Author', example: 'Author 1' })
  author: string;
  @ApiProperty({ description: 'Book Published Year', example: 2020 })
  publishedYear: number;

  @ApiProperty({
    description: 'Book Genre',
    example: { name: 'Fiction', id: 'fdsafsad' },
  })
  genre: {
    name: string;
    id: string;
  };
}

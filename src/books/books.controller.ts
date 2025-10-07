import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { BooksQueryDto, SortDirection, SortField } from './dto/query.dto';

@Controller('books')
@ApiTags('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'perPage', required: false, default: 10 })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    enum: SortDirection,
    default: SortDirection.DESC,
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    enum: SortField,
    default: SortField.CREATED_AT,
  })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number,
    @Query('perPage', new ParseIntPipe({ optional: true })) perPage: number,
    @Query('genre') genre: string,
    @Query('q') q: string,
    @Query('sortField') sortField: string,
    @Query('sortDirection', new ParseEnumPipe(SortDirection))
    sortDirection: SortDirection,
  ) {
    const query: BooksQueryDto = {
      page,
      perPage,
      genre,
      q,
      sortField,
      sortDirection,
    };
    return this.booksService.findAll(query);
  }
}

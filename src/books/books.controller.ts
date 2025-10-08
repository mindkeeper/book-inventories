import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BooksService } from './books.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BooksQueryDto, SortDirection, SortField } from './dto/query.dto';
import { BookEntity, BookResponse } from './entities/book.entity';
import { JwtAuthGuard } from 'src/token/guards/jwt.guard';
import { type BookDto } from './schemas/book.schema';

@Controller('books')
@ApiTags('books')
@ApiBearerAuth()
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
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
    @Query('sortField', new ParseEnumPipe(SortField, { optional: true }))
    sortField: SortField,
    @Query(
      'sortDirection',
      new ParseEnumPipe(SortDirection, { optional: true }),
    )
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Book found', type: BookResponse })
  @ApiResponse({ status: 404, description: 'Book not found' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiBody({ type: BookEntity })
  @ApiResponse({ status: 201, description: 'Book created', type: BookResponse })
  @ApiResponse({ status: 400, description: 'Invalid book data' })
  create(@Body() bookDto: BookDto) {
    return this.booksService.create(bookDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Book deleted', type: BookResponse })
  @ApiResponse({ status: 404, description: 'Book not found' })
  delete(@Param('id') id: string) {
    return this.booksService.delete(id);
  }
}

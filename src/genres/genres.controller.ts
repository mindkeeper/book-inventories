import { Controller, Get, UseGuards } from '@nestjs/common';
import { GenresService } from './genres.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GenreEntity } from './entities/genre.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('genres')
@ApiTags('genres')
@ApiBearerAuth()
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'List all genres',
    type: GenreEntity,
  })
  async findAll() {
    return this.genresService.findAll();
  }
}

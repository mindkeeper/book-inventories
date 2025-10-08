import { Injectable } from '@nestjs/common';
import { paginator, TPaginateFunction } from 'src/utils/paginator/paginator';

@Injectable()
export class PaginatorService {
  paginate: TPaginateFunction = paginator({
    page: 1,
    perPage: 10,
    sortField: 'createdAt',
    sortDirection: 'desc',
  });
}

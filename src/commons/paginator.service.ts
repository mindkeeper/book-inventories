import { Injectable } from '@nestjs/common';
import { IPaginateFunction, paginator } from 'src/utils/paginator/paginator';

@Injectable()
export class PaginatorService {
  paginate: IPaginateFunction = paginator({
    page: 1,
    limit: 10,
    sortField: 'createdAt',
    sortOrder: 'desc',
  });
}

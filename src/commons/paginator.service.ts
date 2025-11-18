import { Injectable } from '@nestjs/common';
import { IPaginateFunction, paginator } from 'src/utils/paginator/paginator';
import {
  ICursorPaginateFunction,
  cursorPaginator,
} from 'src/utils/paginator/cursor.paginator';

@Injectable()
export class PaginatorService {
  paginate: IPaginateFunction = paginator({
    page: 1,
    limit: 10,
    sortField: 'createdAt',
    sortOrder: 'desc',
  });

  cursorPaginate: ICursorPaginateFunction = cursorPaginator({
    limit: 10,
    sortField: 'createdAt',
    sortOrder: 'desc',
  });
}

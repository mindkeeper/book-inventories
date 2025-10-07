export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}
export enum SortField {
  TITLE = 'title',
  AUTHOR = 'author',
  PUBLISHED = 'published',
  GENRE = 'genre',
  CREATED_AT = 'createdAt',
}

export type BooksQueryDto = {
  page?: number;
  perPage?: number;
  genre?: string;
  q?: string;
  sortDirection?: SortDirection;
  sortField?: string;
};

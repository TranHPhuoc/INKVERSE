export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements?: number;
  number: number;
  size: number;
};

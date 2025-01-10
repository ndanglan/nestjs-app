export type ResponseFormat<T> = {
  status: number;
  data: T | null;
  message?: string;
};

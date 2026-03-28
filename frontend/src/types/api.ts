export interface ApiError {
  detail: string | Record<string, string[]>
  code?: string
}

export interface PaginatedResponse<T> {
  next: string | null
  previous: string | null
  results: T[]
}

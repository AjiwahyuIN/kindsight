export type SampleScenario = 'success' | 'empty' | 'error';
export type ServiceOptions = { signal?: AbortSignal };
export type ApiResponse<T, M = never> = { data: T; meta?: M };
export type PageMeta = { page: number; pageSize: number; pages: number; total: number };
export type Money = string; // Decimal strings at the service boundary; never aggregate floats.
export class ServiceError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number, public readonly fields?: Record<string, string>) {
    super(message);
    this.name = 'ServiceError';
  }
}

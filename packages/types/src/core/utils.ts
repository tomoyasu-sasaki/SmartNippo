// ========================================
// Utility types
// ========================================

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type PromiseValue<T> = T extends Promise<infer U> ? U : never;

export type KeysOf<T> = keyof T;

export type ValuesOf<T> = T[keyof T];

export type ExcludeKeys<T, K extends keyof T> = Omit<T, K>;

export type IncludeKeys<T, K extends keyof T> = Pick<T, K>;

// ========================================
// Type Guards
// ========================================

export type TypeGuard<T> = (value: unknown) => value is T;

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isObject(value) && 'then' in value && typeof value.then === 'function')
  );
}

// ========================================
// Async operation types
// ========================================

export type AsyncResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// ========================================
// Common utility types
// ========================================

export type Timestamp = number;
export type Email = string;
export type URL = string;

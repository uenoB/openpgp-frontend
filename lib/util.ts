export type Awaitable<X> = PromiseLike<X> | X

export const addHash = (hash: string): string =>
  hash.startsWith('#') ? hash : '#' + hash

export const isSingle = <X>(array: readonly X[]): array is readonly [X] =>
  0 in array && array.length === 1

export const isAsyncIterable = (obj: object): obj is AsyncIterable<unknown> =>
  Symbol.asyncIterator in obj

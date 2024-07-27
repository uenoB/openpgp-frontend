import { isAsyncIterable } from './util'

// minimum intersection between ReadableStream and openpgp.WebStream
// Node: Safari does not support ReadableStream[Symbol.asyncIterator]
interface Stream<X> {
  getReader: () => { read: () => Promise<ReadableStreamReadResult<X>> }
}

export interface Data {
  readonly data:
    | Uint8Array
    | Uint8Array[]
    | string
    | Stream<Uint8Array | string>
    | AsyncIterable<Uint8Array | string>
  readonly filename?: string | undefined
  readonly contentType?: string | undefined
  readonly title?: string | undefined
  readonly kind?: string | undefined
}

export const readAll = async (
  input: Pick<Data, 'data'>
): Promise<Uint8Array[]> => {
  if (ArrayBuffer.isView(input.data)) return [input.data]
  if (Array.isArray(input.data)) return input.data
  if (typeof input.data === 'string') {
    return [new TextEncoder().encode(input.data)]
  }
  const dst: Uint8Array[] = []
  const push = (s: string | Uint8Array): unknown =>
    dst.push(typeof s === 'string' ? new TextEncoder().encode(s) : s)
  if (isAsyncIterable(input.data)) {
    for await (const i of input.data) push(i)
  } else {
    const reader = input.data.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      push(value)
    }
  }
  return dst
}

export const fetchData = async (url: string): Promise<Data> => {
  const res = await fetch(url)
  const blob = await res.blob()
  if (!res.ok) throw Error(`server response status ${res.status}`)
  const data = blob.stream()
  const contentType = res.headers.get('content-type') ?? undefined
  const name = url.replace(/^.*\//, '')
  const filename = name !== '' ? name : undefined
  return { data, filename, contentType }
}

export const fileData = (file: File): Data => ({
  data: file.stream(),
  filename: file.name,
  contentType: file.type
})

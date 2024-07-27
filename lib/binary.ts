export type Octets = string & { __octetsBrand: never }

export const binaryToOctets = (src: Uint8Array[]): Octets =>
  src
    .map(a => {
      try {
        return String.fromCharCode(...a)
      } catch {
        return Array.from(a, i => String.fromCharCode(i)).join('')
      }
    })
    .join('') as Octets

export const octetsToBinary = (src: Octets): Uint8Array =>
  Uint8Array.from(src, x => x.charCodeAt(0))

export const hexdump = (src: Uint8Array): string =>
  Array.from(src, i => i.toString(16).padStart(2, '0')).join('')

export const decodeBase64 = (src: string): Uint8Array => {
  src = src.replace(/[-_]/g, i => (i === '-' ? '+' : '/'))
  src += '='.repeat(3 - ((src.length + 3) % 4))
  return octetsToBinary(window.atob(src) as Octets)
}

export const encodeBase64 = (src: Uint8Array[]): string => {
  const octets = window.btoa(binaryToOctets(src)) as Octets
  const ret = octets.replace(/[+/]/g, i => (i === '+' ? '-' : '_'))
  return ret.replace(/=+$/, '')
}

export const concatBinary = (arrays: Uint8Array[]): Uint8Array => {
  const length = arrays.reduce((z, i) => z + i.length, 0)
  const dst = new Uint8Array(length)
  let offset = 0
  for (const i of arrays) {
    dst.set(i, offset)
    offset += i.length
  }
  return dst
}

export const decodeUTF8 = (src: Uint8Array[]): string | undefined => {
  const decoder = new TextDecoder('utf-8', { fatal: true })
  const dst: string[] = []
  try {
    src.forEach((array, i) => {
      dst.push(decoder.decode(array, { stream: i + 1 < src.length }))
    })
    return dst.join('')
  } catch {
    return undefined
  }
}

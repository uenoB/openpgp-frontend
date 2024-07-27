import * as openpgp from 'openpgp'
import { type Awaitable, isSingle } from './util'
import { concatBinary, decodeUTF8, hexdump } from './binary'
import { type Data, readAll } from './data'
import { type FeaturesChecked, SingleKey, Key } from './key'
import { PublicKey } from './public-key'
import { PrivateKey } from './private-key'
import { messages } from './messages'

const readRevocations = async (
  input: string
): Promise<openpgp.PacketList<openpgp.SignaturePacket>> => {
  const { data, type } = await openpgp.unarmor(input)
  if (type !== openpgp.enums.armor.publicKey) {
    throw Error('Not an armored public key')
  }
  // OpenPGP's typing of PacketList.fromBinary is wrong
  const packets = await (openpgp.PacketList.fromBinary(data, {
    [openpgp.SignaturePacket.tag]: openpgp.SignaturePacket
  } as unknown as openpgp.AllowedPackets) as unknown as Promise<
    openpgp.PacketList<openpgp.SignaturePacket>
  >)
  if (packets.length <= 0) throw Error('No signature found')
  for (const i of packets) {
    if (i.signatureType !== openpgp.enums.signature.keyRevocation) {
      throw Error('Non-revocation signature found')
    }
  }
  return packets
}

export type UpdatePublicKeys = (keys: PublicKeys) => Awaitable<PublicKeys>

interface Info {
  readonly error?: boolean | undefined
  readonly info: string
  readonly data?: never // distinct from Data
}

type ProcessResult = Info | Data | UpdatePublicKeys | PrivateKey | undefined

export class PublicKeys extends Key {
  declare readonly privateKey?: never // distinct from PrivateKey
  readonly publicKeys: ReadonlyMap<string, PublicKey>

  protected constructor(publicKeys: ReadonlyMap<string, PublicKey>) {
    super()
    this.publicKeys = publicKeys
  }

  static async from(keys: openpgp.Key[]): Promise<PublicKeys> {
    const publicKeys = new Map<string, PublicKey>()
    for (const key of keys) {
      const fingerprint = key.getFingerprint()
      const old = publicKeys.get(fingerprint)
      const publicKey =
        old != null
          ? await old.merge(key.toPacketList())
          : await PublicKey.from(key)
      publicKeys.set(fingerprint, publicKey)
    }
    return new PublicKeys(publicKeys)
  }

  static #empty: PublicKeys | undefined

  static get empty(): PublicKeys {
    return (this.#empty ??= new PublicKeys(new Map()))
  }

  get size(): number {
    return this.publicKeys.size
  }

  #features: FeaturesChecked | undefined

  override get features(): FeaturesChecked {
    if (this.#features != null) return this.#features
    const keys = Array.from(this)
    const valid = keys.every(k => k.features.valid)
    const signing = keys.length > 0 && keys.every(k => k.features.signing)
    const encryption = keys.length > 0 && keys.every(k => k.features.encryption)
    const error = keys.map(k => k.features.error ?? '').join('\n')
    return (this.#features = { valid, signing, encryption, error })
  }

  override serialize(): Uint8Array[] {
    return Array.from(this, i => i.publicKey.write())
  }

  override armor(): Data {
    const keys = Array.from(this)
    if (isSingle(keys)) return keys[0].armor()
    const binary = concatBinary(keys.map(i => i.publicKey.write()))
    const data = openpgp.armor(openpgp.enums.armor.publicKey, binary)
    const title = messages._publicKeyFileContaining(keys.map(i => i.keyID))
    const kind = messages._kindPublicKey
    return { data, filename: `keys-public.asc`, title, kind }
  }

  getUsers(): string[] {
    return Array.from(this, key => key.userID)
  }

  #getUserOf: ReadonlyMap<string, PublicKey> | undefined

  getUserOf(keyID: openpgp.KeyID): string {
    if (this.#getUserOf == null) {
      const newIndex = new Map<string, PublicKey>()
      for (const key of this) {
        const id = key.publicKey.getKeyID().bytes
        if (newIndex.has(id)) {
          newIndex.delete(id)
        } else {
          newIndex.set(id, key)
        }
      }
      this.#getUserOf = newIndex
    }
    return this.#getUserOf.get(keyID.bytes)?.userID ?? keyID.toHex()
  }

  delete(fingerprints: Iterable<string>): PublicKeys {
    const newPublicKeys = new Map(this.publicKeys)
    for (const fingerprint of fingerprints) {
      newPublicKeys.delete(fingerprint)
    }
    return this.publicKeys.size !== newPublicKeys.size
      ? new PublicKeys(newPublicKeys)
      : this
  }

  validKeys(): PublicKeys {
    const newPublicKeys = new Map<string, PublicKey>()
    for (const [fingerprint, key] of this.publicKeys) {
      if (key.features.valid) newPublicKeys.set(fingerprint, key)
    }
    return this.publicKeys.size !== newPublicKeys.size
      ? new PublicKeys(newPublicKeys)
      : this
  }

  [Symbol.iterator](): IterableIterator<PublicKey> {
    return this.publicKeys.values()
  }

  private listOpenpgpPublicKeys(): openpgp.PublicKey[] {
    return Array.from(this, i => i.publicKey)
  }

  async importKeys(
    keys: Iterable<openpgp.Key | SingleKey>
  ): Promise<PublicKeys> {
    const newPublicKeys = new Map(this.publicKeys)
    let modified = false
    for (const key of keys) {
      const openpgpKey = key instanceof SingleKey ? key.openpgpKey() : key
      const fingerprint = openpgpKey.getFingerprint()
      const oldPublicKey = newPublicKeys.get(fingerprint)
      const newPublicKey =
        oldPublicKey != null
          ? await oldPublicKey.merge(openpgpKey.toPublic().toPacketList())
          : key instanceof PublicKey
            ? key
            : await PublicKey.from(openpgpKey)
      modified ||= newPublicKey !== oldPublicKey
      newPublicKeys.set(fingerprint, newPublicKey)
    }
    return modified ? new PublicKeys(newPublicKeys) : this
  }

  private async encrypt(args: {
    armor: boolean
    message: openpgp.Message<Uint8Array | string>
    filename: string
  }): Promise<Data> {
    const { message, armor } = args
    const encryptionKeys = this.listOpenpgpPublicKeys()
    const result = armor
      ? await openpgp.encrypt({ message, encryptionKeys, format: 'armored' })
      : await openpgp.encrypt({ message, encryptionKeys, format: 'binary' })
    const filename = armor ? `${args.filename}.asc` : `${args.filename}.pgp`
    const title = messages._encryptedFor(this.getUsers())
    return { data: result, filename, title, kind: messages._kindEncrypted }
  }

  private async verify(
    args:
      | { text: true; message: openpgp.CleartextMessage; filename: string }
      | { text: false; message: openpgp.Message<Uint8Array>; filename: string }
  ): Promise<Array<Promise<Info> | Data>> {
    const verificationKeys = this.listOpenpgpPublicKeys()
    const result = args.text
      ? await openpgp.verify({
          message: args.message,
          verificationKeys,
          format: 'utf8'
        })
      : await openpgp.verify({
          message: args.message,
          verificationKeys,
          format: 'binary'
        })
    const results = result.signatures.map(async sig => {
      const signer = this.getUserOf(sig.keyID)
      try {
        await sig.verified
        return { info: messages._goodSignatureBy(signer) }
      } catch (error) {
        const info = messages._badSignatureBy(signer, String(error))
        return { error: true, info }
      }
    })
    const data = {
      data: result.data,
      filename: args.filename.replace(/\.(?:pgp|gpg|asc)$/, ''),
      title: messages._verifiedContentOf(args.filename),
      kind: messages._kindVerified
    }
    return [...results, data]
  }

  private certify(keys: openpgp.Key[]): Array<Awaitable<ProcessResult>> {
    const verificationKeys = this.listOpenpgpPublicKeys()
    const privateKey =
      isSingle(keys) && keys[0].isPrivate()
        ? PrivateKey.from(keys[0])
        : undefined
    if (verificationKeys.length <= 0) {
      // if current public key is empty, replace the keyring at all
      return [privateKey ?? (async () => await PublicKeys.from(keys))]
    }
    const results = keys.map(async key => {
      const sigs = await key.verifyAllUsers(verificationKeys)
      const lines: string[] = []
      let error = false
      for (const { userID, keyID, valid } of sigs) {
        if (valid == null) {
          lines.push(messages._keyIsNotSignedByAnyGivenKey(userID))
        } else if (valid) {
          lines.push(messages._keyIsSignedBy(userID, this.getUserOf(keyID)))
        } else {
          const signer = this.getUserOf(keyID)
          lines.push(messages._keyHasBadSignatureOf(userID, signer))
          error = true
        }
      }
      return { error, info: lines.join('\n'), key }
    })
    const keyring = async (): Promise<UpdatePublicKeys> => {
      const all = await Promise.all(results).catch(() => [])
      const keys = all.filter(i => !i.error).map(i => i.key)
      return async old => await old.importKeys(keys)
    }
    return [...results, privateKey ?? keyring()]
  }

  private revoke(
    packets: readonly openpgp.SignaturePacket[]
  ): Array<Info | UpdatePublicKeys> {
    const info = packets.map(sig => ({
      info: messages._mergeRevocationCertificateOf(sig.issuerKeyID.toHex())
    }))
    const keyring: UpdatePublicKeys = async old => {
      const newPublicKeys = new Map(old.publicKeys)
      let modified = false
      for (const sig of packets) {
        if (sig.issuerFingerprint == null) continue
        const fingerprint = hexdump(sig.issuerFingerprint)
        const oldPublicKey = newPublicKeys.get(fingerprint)
        if (oldPublicKey == null) continue
        const newPublicKey = await oldPublicKey.merge([sig])
        newPublicKeys.set(fingerprint, newPublicKey)
        modified = oldPublicKey !== newPublicKey
      }
      return modified ? new PublicKeys(newPublicKeys) : old
    }
    return [...info, keyring]
  }

  async process(input: Data): Promise<Array<Awaitable<ProcessResult>>> {
    const filename = input.filename ?? 'data'
    const data = await readAll(input)
    const text = decodeUTF8(data)
    const features = this.features
    let lastError: unknown
    let proc: (() => Awaitable<Array<Awaitable<ProcessResult>>>) | undefined
    if (text != null && text !== '') {
      try {
        const keys = await openpgp.readKeys({ armoredKeys: text })
        proc = () => this.certify(keys)
      } catch (error) {
        lastError = error
      }
      if (proc == null) {
        try {
          const packets = await readRevocations(text)
          proc = () => this.revoke(packets)
        } catch (error) {
          lastError = error
        }
      }
      if (proc == null && features.signing) {
        try {
          const cleartextMessage = text
          const msg = await openpgp.readCleartextMessage({ cleartextMessage })
          const args = { text: true, message: msg, filename } as const
          proc = async () => await this.verify(args)
        } catch (error) {
          lastError = error
        }
      }
      if (proc == null && features.encryption) {
        const message = await openpgp.createMessage({ text, filename })
        proc = () => [this.encrypt({ armor: true, message, filename })]
      }
    }
    if (proc == null) {
      const binary = concatBinary(data)
      try {
        const keys = await openpgp.readKeys({ binaryKeys: binary })
        proc = () => this.certify(keys)
      } catch (error) {
        lastError = error
      }
      if (proc == null && features.signing) {
        try {
          const msg = await openpgp.readMessage({ binaryMessage: binary })
          const p = msg.packets.filterByTag(openpgp.enums.packet.literalData)
          if (p.length === 1) {
            const args = { text: false, message: msg, filename } as const
            proc = async () => await this.verify(args)
          }
        } catch (error) {
          lastError = error
        }
      }
      if (proc == null && features.encryption) {
        const msg = await openpgp.createMessage({ binary, filename })
        proc = () => [this.encrypt({ armor: false, message: msg, filename })]
      }
    }
    if (proc == null) throw lastError
    return await proc()
  }
}

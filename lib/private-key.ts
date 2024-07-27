import * as openpgp from 'openpgp'
import type { Awaitable } from './util'
import { type Data, readAll } from './data'
import { concatBinary, decodeUTF8 } from './binary'
import { type FeaturesChecked, SingleKey } from './key'
import { PublicKey } from './public-key'
import type { UpdatePublicKeys } from './public-keys'
import { messages } from './messages'

interface Info {
  readonly info: string
}

export type ProcessResult = Info | Data | UpdatePublicKeys | undefined

export class PrivateKey extends SingleKey {
  declare readonly publicKey?: never // distinct from PublicKey
  declare readonly publicKeys?: never // distinct from PublicKeys
  readonly privateKey: openpgp.PrivateKey
  readonly encryptedKey: openpgp.PrivateKey

  override openpgpKey(): openpgp.PrivateKey {
    return this.encryptedKey
  }

  protected constructor(args: {
    features: FeaturesChecked
    primaryUser: openpgp.UserIDPacket | null
    privateKey: openpgp.PrivateKey
    encryptedKey?: openpgp.PrivateKey
  }) {
    super(args)
    this.privateKey = args.privateKey
    this.encryptedKey = args.encryptedKey ?? args.privateKey
  }

  static async from(key: openpgp.PrivateKey): Promise<PrivateKey> {
    const features = await this.checkKey(key)
    const primaryUser = (await key.getPrimaryUser()).user.userID
    return new PrivateKey({ features, privateKey: key, primaryUser })
  }

  clone(): PrivateKey {
    return new PrivateKey(this)
  }

  static checkGenerate(args: {
    name: string
    email: string
    passphrase: string
  }): boolean {
    const { name, email, passphrase } = args
    if (name === '' || email === '' || passphrase === '') return false
    try {
      openpgp.UserIDPacket.fromObject({ name: args.name, email: args.email })
      return true
    } catch {
      return false
    }
  }

  static async generate(args: {
    name: string
    email: string
    passphrase: string
  }): Promise<PrivateKey> {
    const { privateKey } = await openpgp.generateKey({
      userIDs: { name: args.name, email: args.email },
      passphrase: args.passphrase,
      format: 'object'
    })
    return new PrivateKey({
      privateKey,
      primaryUser: (await privateKey.getPrimaryUser()).user.userID,
      features: await this.checkKey(privateKey)
    })
  }

  featureNames(): Array<'Decryption' | 'Signing' | 'Certification'> {
    const dst: Array<'Decryption' | 'Signing' | 'Certification'> = []
    const feat = this.features
    if (feat.encryption) dst.push('Decryption')
    if (feat.valid) dst.push(feat.signing ? 'Signing' : 'Certification')
    return dst
  }

  isDecrypted(): boolean {
    return this.privateKey.isDecrypted()
  }

  override armor(privateKey = false): Data {
    if (!privateKey) return PublicKey.fromKey(this).armor()
    const data = this.encryptedKey.armor()
    const title = messages._privateKeyFileContaining(this.keyID)
    const filename = `${this.keyID}-private.asc`
    return { data, title, filename, kind: messages._kindPrivateKey }
  }

  async decryptKey(passphrase: string): Promise<PrivateKey> {
    const privateKey = this.privateKey
    const decryptedKey = await openpgp.decryptKey({ privateKey, passphrase })
    return new PrivateKey({ ...this, privateKey: decryptedKey })
  }

  async encryptKey(passphrase: string): Promise<PrivateKey> {
    const privateKey = this.privateKey
    const encryptedKey = await openpgp.encryptKey({ privateKey, passphrase })
    return new PrivateKey({ ...this, privateKey: encryptedKey, encryptedKey })
  }

  async createRevokeCert(): Promise<Data> {
    const key = this.privateKey
    const { publicKey } = await openpgp.revokeKey({ key, format: 'object' })
    const data = (await publicKey.getRevocationCertificate()) ?? ''
    const filename = `${this.keyID}-revoke.asc`
    const title = messages._revocationCertificateOf(this.keyID)
    return { data, filename, title, kind: messages._kindRevokeCert }
  }

  private async decrypt(
    message: openpgp.Message<Uint8Array | string>
  ): Promise<Data> {
    const result = await openpgp.decrypt({
      message,
      decryptionKeys: [this.privateKey],
      format: 'binary'
    })
    const title = messages._decryptedBy(this.keyID)
    const kind = messages._kindDecrypted
    return { data: result.data, filename: result.filename, title, kind }
  }

  private async clearsign(
    message: openpgp.CleartextMessage,
    inputFilename: string
  ): Promise<Data> {
    const result = await openpgp.sign({
      message,
      signingKeys: this.privateKey,
      format: 'armored'
    })
    const filename = `${inputFilename}.asc`
    const title = messages._signedBy(this.keyID)
    return { data: result, filename, title, kind: messages._kindSigned }
  }

  private async sign(
    message: openpgp.Message<Uint8Array>,
    inputFilename: string
  ): Promise<Data> {
    const result = await openpgp.sign({
      message,
      signingKeys: this.privateKey,
      format: 'binary'
    })
    const filename = `${inputFilename}.pgp`
    const title = messages._signedBy(this.keyID)
    return { data: result, filename, title, kind: messages._kindSigned }
  }

  private certificate(
    keys: openpgp.Key[],
    inputFilename: string
  ): Array<Promise<ProcessResult>> {
    const signProcs = keys.map(async key => {
      const primaryUser = await key.getPrimaryUser()
      const user = primaryUser.user.userID?.userID ?? key.getKeyID().toHex()
      const signedKey = await key.toPublic().signPrimaryUser([this.privateKey])
      const info = messages._signUserByKey(user, this.keyID)
      return { info, user, signedKey }
    })
    const writer = (async () => {
      const all = await Promise.all(signProcs).catch(() => undefined)
      if (all == null) return undefined
      const filename = `${inputFilename}.key.asc`
      const binary = concatBinary(all.map(i => i.signedKey.write()))
      const data = openpgp.armor(openpgp.enums.armor.publicKey, binary)
      const users = all.map(i => i.user)
      const title = messages._publicKeysSignedByKey(this.keyID, users)
      return { data, filename, title, kind: messages._kindCertificated }
    })()
    const keyring = (async (): Promise<UpdatePublicKeys | undefined> => {
      const all = await Promise.all(signProcs).catch(() => undefined)
      if (all == null) return undefined
      const keys = all.map(i => i.signedKey)
      return async old => await old.importKeys(keys)
    })()
    return [...signProcs, writer, keyring]
  }

  async process(input: Data): Promise<Array<Awaitable<ProcessResult>>> {
    const filename = input.filename ?? 'NoName'
    const data = await readAll(input)
    const text = decodeUTF8(data)
    const features = this.features
    let proc: (() => Array<Awaitable<ProcessResult>>) | undefined
    let lastError: unknown
    if (text != null && text !== '') {
      try {
        const keys = await openpgp.readKeys({ armoredKeys: text })
        proc = () => this.certificate(keys, filename)
      } catch (error) {
        lastError = error
      }
      if (proc == null && features.encryption) {
        try {
          const msg = await openpgp.readMessage({ armoredMessage: text })
          proc = () => [this.decrypt(msg)]
        } catch (error) {
          lastError = error
        }
      }
      if (proc == null && features.signing) {
        const msg = await openpgp.createCleartextMessage({ text })
        proc = () => [this.clearsign(msg, filename)]
      }
    }
    if (proc == null) {
      const binary = concatBinary(data)
      try {
        const keys = await openpgp.readKeys({ binaryKeys: binary })
        proc = () => this.certificate(keys, filename)
      } catch (error) {
        lastError = error
      }
      if (proc == null && features.encryption) {
        try {
          const msg = await openpgp.readMessage({ binaryMessage: binary })
          const ids = msg.getEncryptionKeyIDs()
          if (ids.length > 0) proc = () => [this.decrypt(msg)]
        } catch (error) {
          lastError = error
        }
      }
      if (proc == null && features.signing) {
        const msg = await openpgp.createMessage({ binary, filename })
        proc = () => [this.sign(msg, filename)]
      }
    }
    if (proc == null) throw lastError
    return proc()
  }
}

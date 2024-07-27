import type * as openpgp from 'openpgp'
import type { Data } from './data'

export interface Features {
  readonly valid: boolean
  readonly signing: boolean
  readonly encryption: boolean
}

export interface FeaturesChecked extends Features {
  readonly error?: string | undefined
}

export abstract class Key {
  declare readonly data?: never // distinct from Data
  declare readonly info?: never // distinct from Info
  abstract readonly features: FeaturesChecked
  abstract serialize(): Uint8Array[]
  abstract armor(privateKey?: boolean | undefined): Data
}

export abstract class SingleKey extends Key {
  declare readonly publicKeys?: never // distinct from PublicKeys
  override readonly features: FeaturesChecked
  readonly primaryUser: openpgp.UserIDPacket | null

  protected constructor(args: {
    features: FeaturesChecked
    primaryUser: openpgp.UserIDPacket | null
  }) {
    super()
    this.features = args.features
    this.primaryUser = args.primaryUser
  }

  abstract openpgpKey(): openpgp.Key

  #fingerprint: string | undefined
  #keyID: string | undefined

  get fingerprint(): string {
    return (this.#fingerprint ??= this.openpgpKey().getFingerprint())
  }

  get keyID(): string {
    return (this.#keyID ??= this.openpgpKey().getKeyID().toHex())
  }

  get userName(): string {
    const name = this.primaryUser?.name
    return name != null && name !== '' ? name : this.keyID
  }

  get email(): string | undefined {
    const email = this.primaryUser?.email
    return email != null && email !== '' ? email : undefined
  }

  get userID(): string {
    return this.primaryUser?.userID ?? this.keyID
  }

  override serialize(): Uint8Array[] {
    return [this.openpgpKey().write()]
  }

  static async checkKey(key: openpgp.Key): Promise<FeaturesChecked> {
    const errors: string[] = []
    let valid = false
    let signing = false
    let encryption = false
    try {
      await key.verifyPrimaryKey()
      valid = true
    } catch (error) {
      errors.push(String(error))
    }
    if (valid) {
      try {
        await key.getSigningKey()
        signing = true
      } catch (error) {
        errors.push(String(error))
      }
      try {
        await key.getEncryptionKey()
        encryption = true
      } catch (error) {
        errors.push(String(error))
      }
    }
    const error = errors.length > 0 ? errors.join('\n') : undefined
    return { valid, signing, encryption, error }
  }
}

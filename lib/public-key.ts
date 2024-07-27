import * as openpgp from 'openpgp'
import { type Octets, binaryToOctets } from './binary'
import type { Data } from './data'
import { type FeaturesChecked, SingleKey } from './key'
import { messages } from './messages'

export class PublicKey extends SingleKey {
  declare readonly privateKey?: never // distinct from PrivateKey
  readonly publicKey: openpgp.PublicKey

  override openpgpKey(): openpgp.PublicKey {
    return this.publicKey
  }

  private constructor(args: {
    publicKey: openpgp.PublicKey
    primaryUser: openpgp.UserIDPacket | null
    features: FeaturesChecked
  }) {
    super(args)
    this.publicKey = args.publicKey
  }

  static async from(key: openpgp.Key): Promise<PublicKey> {
    const publicKey = key.toPublic()
    return new PublicKey({
      features: await this.checkKey(publicKey),
      publicKey,
      primaryUser: (await publicKey.getPrimaryUser()).user.userID
    })
  }

  static fromKey(key: SingleKey): PublicKey {
    if (key instanceof PublicKey) return key
    return new PublicKey({
      features: key.features,
      publicKey: key.openpgpKey().toPublic(),
      primaryUser: key.primaryUser
    })
  }

  async merge(
    packets: readonly openpgp.AllowedKeyPackets[]
  ): Promise<PublicKey> {
    const packetList = this.publicKey.toPacketList()
    const set = new Set<Octets>()
    for (const i of packetList) {
      set.add(binaryToOctets([i.write()]))
    }
    const origLength = packetList.length
    for (const i of packets) {
      if (!set.has(binaryToOctets([i.write()]))) packetList.push(i)
    }
    if (packetList.length === origLength) return this
    return await PublicKey.from(new openpgp.PublicKey(packetList))
  }

  override armor(): Data {
    const data = this.publicKey.armor()
    const title = messages._publicKeyFileContaining([this.keyID])
    const filename = `${this.keyID}-public.asc`
    return { data, title, filename, kind: messages._kindPublicKey }
  }
}

import type { SingleKey } from '../../lib/key'
import { messages } from '../../lib/messages'

const FingerprintContent: preact.FunctionComponent<{
  pgpKey: SingleKey
  children?: never
}> = ({ pgpKey: key }) => (
  <>
    {key.fingerprint.slice(0, -16)}
    <strong>{key.fingerprint.slice(-16)}</strong>
  </>
)

export const Fingerprint: preact.FunctionComponent<{
  pgpKey: SingleKey
}> = ({ pgpKey: key }) => (
  <code
    className="openpgp-key-fingerprint"
    title={messages._publicKeyFeatureExplanation(key.features)}
  >
    {key.features.valid ? (
      <FingerprintContent pgpKey={key} />
    ) : (
      <s>
        <FingerprintContent pgpKey={key} />
      </s>
    )}
  </code>
)

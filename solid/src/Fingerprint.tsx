import { type VoidComponent, Show } from 'solid-js'
import type { SingleKey } from '../../lib/key'
import { messages } from '../../lib/messages'

const FingerprintContent: VoidComponent<{ key: SingleKey }> = props => (
  <>
    {props.key.fingerprint.slice(0, -16)}
    <strong>{props.key.fingerprint.slice(-16)}</strong>
  </>
)

export const Fingerprint: VoidComponent<{ key: SingleKey }> = props => (
  <code
    class="openpgp-key-fingerprint"
    title={messages._publicKeyFeatureExplanation(props.key.features)}
  >
    <Show
      when={props.key.features.valid}
      fallback={
        <s>
          <FingerprintContent key={props.key} />
        </s>
      }
    >
      <FingerprintContent key={props.key} />
    </Show>
  </code>
)

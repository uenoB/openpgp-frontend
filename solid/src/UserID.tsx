import { type VoidComponent, Show } from 'solid-js'
import type { SingleKey } from '../../lib/key'

export const UserID: VoidComponent<{ key: SingleKey }> = props => (
  <>
    {props.key.userName}
    <Show when={props.key.email}>
      {email => (
        <>
          {' '}
          <a class="openpgp-userid-email" href={`mailto:${email()}`}>
            {email()}
          </a>
        </>
      )}
    </Show>
  </>
)

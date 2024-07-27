import type { VoidComponent } from 'solid-js'
import { messages } from '../../lib/messages'

export const DeleteButton: VoidComponent<{ onClick: () => void }> = props => (
  <button
    title={messages._deleteThisItem}
    onClick={() => {
      props.onClick()
    }}
    class="openpgp-button-close"
  >
    ✖
  </button>
)

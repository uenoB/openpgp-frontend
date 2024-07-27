import type { VoidComponent } from 'solid-js'
import type { Key } from '../../lib/key'
import { messages } from '../../lib/messages'
import { state } from './state'

export const ExportKey: VoidComponent<{
  key: Key
}> = props => {
  const onClick = (e: Event): void => {
    e.preventDefault()
    state.run([props.key.armor()])
  }
  return (
    <button
      onClick={onClick}
      title={messages._savePublicKeyInFile}
      class="openpgp-button-export-key"
    >
      ➜
    </button>
  )
}

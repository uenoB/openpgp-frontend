import { useCallback } from 'preact/hooks'
import type { Key } from '../../lib/key'
import { messages } from '../../lib/messages'
import { state } from './state'

export const ExportKey: preact.FunctionComponent<{
  pgpKey: Key
}> = ({ pgpKey: key }) => {
  const onClick = useCallback(
    (e: Event): void => {
      e.preventDefault()
      state.run([key.armor()])
    },
    [key]
  )
  return (
    <button
      onClick={onClick}
      title={messages._savePublicKeyInFile}
      className="openpgp-button-export-key"
    >
      ➜
    </button>
  )
}

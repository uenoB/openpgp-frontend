import { messages } from '../../lib/messages'

export const DeleteButton: preact.FunctionComponent<{
  onClick: () => void
  children?: never
}> = ({ onClick }) => (
  <button
    title={messages._deleteThisItem}
    onClick={onClick}
    className="openpgp-button-close"
  >
    ✖
  </button>
)

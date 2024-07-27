import { useCallback } from 'preact/hooks'
import { addHash } from '../../lib/util'
import { useNotice, state } from './state'

export const Anchor: preact.FunctionComponent<{
  onClick: () => void
}> = ({ onClick, children }) => {
  const hash = useNotice(state.hash)
  const onClickHandler = useCallback(
    (e: Event) => {
      e.preventDefault()
      onClick()
    },
    [onClick]
  )
  return (
    <a href={addHash(hash)} onClick={onClickHandler}>
      {children}
    </a>
  )
}

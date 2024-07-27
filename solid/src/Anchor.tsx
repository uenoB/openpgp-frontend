import { type ParentComponent } from 'solid-js'
import { addHash } from '../../lib/util'
import { getHash } from './state'

export const Anchor: ParentComponent<{ onClick: () => void }> = props => (
  <a
    href={addHash(getHash())}
    onClick={(e: Event) => {
      e.preventDefault()
      props.onClick()
    }}
  >
    {props.children}
  </a>
)

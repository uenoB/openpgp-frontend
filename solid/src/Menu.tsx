import { type VoidComponent, onMount } from 'solid-js'
import { messages } from '../../lib/messages'
import { getOpenFile, state } from './state'
import { Anchor } from './Anchor'
import { Greetings } from './Greetings'
import { FileInput } from './FileInput'

const about = (): void => {
  state.run([{ info: () => <Greetings /> }])
}

export const openKeyring = (): void => {
  state.run([x => x], { scroll: false })
}

export const Menu: VoidComponent = () => {
  onMount(about)
  return (
    <div class="openpgp-menu">
      <ul>
        <li>
          <Anchor onClick={about}>{messages._aboutMenu}</Anchor>
        </li>
        <li>
          <a href="#.">{messages._newKeyMenu}</a>
        </li>
        <li>
          <Anchor onClick={openKeyring}>{messages._keyringMenu}</Anchor>
        </li>
        <li>
          <FileInput onSelect={getOpenFile()} multiple />
        </li>
      </ul>
    </div>
  )
}

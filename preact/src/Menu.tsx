import { messages } from '../../lib/messages'
import { Anchor } from './Anchor'
import { FileInput } from './FileInput'
import { Greetings } from './Greetings'
import { type Files, state } from './state'

export const about = (): void => {
  state.run([{ info: () => <Greetings /> }])
}

export const openKeyring = (): void => {
  state.run([x => x], { scroll: false })
}

export const Menu: preact.FunctionComponent<{
  onFileOpen?: ((files: Files) => void) | undefined
  children?: never
}> = ({ onFileOpen }) => (
  <div className="openpgp-menu">
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
        <FileInput onSelect={onFileOpen} multiple />
      </li>
    </ul>
  </div>
)

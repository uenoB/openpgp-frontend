import type { VoidComponent, JSX } from 'solid-js'
import { isServer } from 'solid-js/web'
import { onCleanup, onMount } from 'solid-js'
import { getMode, getOpenFile, state } from './state'
import { Droppable } from './Droppable'
import { Results } from './Results'
import { Menu } from './Menu'
import { NewKey } from './NewKey'
import { PrivateKeyView } from './PrivateKeyView'
import { PublicKeyView } from './PublicKeyView'

const mainComponent = (): JSX.Element => {
  const mode = getMode()
  if (mode === '#.') return <NewKey />
  if (mode != null) return <PrivateKeyView privateKey={mode} />
  return <PublicKeyView />
}

const onHashChange = (): void => {
  state.processHash(window.location.hash)
}

export const App: VoidComponent = () => {
  if (!isServer) {
    onMount(() => {
      window.addEventListener('hashchange', onHashChange)
    })
    onCleanup(() => {
      window.removeEventListener('hashchange', onHashChange)
    })
    onMount(onHashChange)
  }
  return (
    <Droppable class="openpgp-app" onDrop={getOpenFile()}>
      <div class="openpgp-left-column">
        <Menu />
        <div class="openpgp-main">{mainComponent()}</div>
      </div>
      <Results class="openpgp-result-list" />
    </Droppable>
  )
}

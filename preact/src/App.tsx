import { useEffect } from 'preact/hooks'
import { Droppable } from './Droppable'
import { state, useNotice } from './state'
import { Menu, about } from './Menu'
import { Results } from './Results'
import { NewKey } from './NewKey'
import { PrivateKeyView } from './PrivateKeyView'
import { PublicKeyView } from './PublicKeyView'

const Main: preact.FunctionComponent<{
  children?: never
}> = () => {
  const mode = useNotice(state.mode)
  if (mode === '#.') return <NewKey />
  if (mode != null) return <PrivateKeyView privateKey={mode} key={mode} />
  return <PublicKeyView />
}

const Top: preact.FunctionComponent<{ children?: never }> = () => {
  const openFile = useNotice(state.openFile)
  return (
    <Droppable className="openpgp-app" onDrop={openFile}>
      <div className="openpgp-left-column">
        <Menu onFileOpen={openFile} />
        <div className="openpgp-main">
          <Main />
        </div>
      </div>
      <Results className="openpgp-result-list" />
    </Droppable>
  )
}

const onHashChange = (): void => {
  state.processHash(window.location.hash)
}

export const App: preact.FunctionComponent<{ children?: never }> = () => {
  useEffect(() => {
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])
  useEffect(() => {
    onHashChange()
    about()
  }, [])
  return <Top />
}

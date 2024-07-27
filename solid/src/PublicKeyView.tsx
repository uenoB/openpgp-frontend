import type { VoidComponent } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal } from 'solid-js'
import type { PublicKey } from '../../lib/public-key'
import type { PublicKeys } from '../../lib/public-keys'
import { Items } from '../../lib/items'
import { messages } from '../../lib/messages'
import { getKeyring, state } from './state'
import { DeleteButton } from './DeleteButton'
import { UserID } from './UserID'
import { Fingerprint } from './Fingerprint'
import { ExportKey } from './ExportKey'

const pageTitle = (key: PublicKeys): string => {
  if (key.size <= 0) return messages._openPgpPublicKeyEncryptionFrontend
  return messages._publicKeysTitle(key.size)
}

export const PublicKeyView: VoidComponent = () => {
  createEffect(() => {
    const keyring = getKeyring()
    if (keyring.size <= 0) {
      document.title = messages._openPgpPublicKeyEncryptionFrontend
    } else {
      document.title = messages._openPgpPublicKeys(keyring.size)
    }
  })
  const validKeys = createMemo(() => getKeyring().validKeys())
  const [unchecked, setUnchecked] = createSignal(Items.from<PublicKey>([]))
  const checkedKeys = createMemo(() => {
    return validKeys().delete(Array.from(unchecked(), i => i.fingerprint))
  })
  createEffect(() => {
    state.setProcessor(checkedKeys())
  })
  const allChecked = createMemo(() => {
    return Array.from(validKeys()).every(i => !unchecked().has(i))
  })
  const onCheckAll = (): void => {
    setUnchecked(old => (allChecked() ? old.add(validKeys()) : Items.from([])))
  }
  const onCheck = (key: PublicKey) => (): void => {
    setUnchecked(old => (old.has(key) ? old.delete(key) : old.add([key])))
  }
  const deleteKey = (key: PublicKey) => (): void => {
    state.run([old => old.delete([key.fingerprint])], { scroll: false })
    setUnchecked(old => old.delete(key))
  }
  return (
    <>
      <p class="openpgp-page-title">{pageTitle(getKeyring())}</p>
      <Show when={getKeyring().size > 0}>
        <p>{messages._publicKeysExplanation1}</p>
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  name="all"
                  title={messages._selectAll}
                  checked={allChecked()}
                  onClick={onCheckAll}
                />
              </th>
              <th class="openpgp-column-wide">{messages._owner}</th>
              <th />
              <th>{messages._fingerprint}</th>
              <th>
                <ExportKey key={getKeyring()} />
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={Array.from(getKeyring())}>
              {key => (
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      name="keys"
                      checked={key.features.valid && !unchecked().has(key)}
                      disabled={!key.features.valid}
                      onClick={onCheck(key)}
                    />
                  </td>
                  <td>
                    <UserID key={key} />{' '}
                  </td>
                  <td>
                    <DeleteButton onClick={deleteKey(key)} />
                  </td>
                  <td>
                    <Fingerprint key={key} />
                  </td>
                  <td>
                    <ExportKey key={key} />
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
      {messages._publicKeysExplanation2(checkedKeys().features)}
    </>
  )
}

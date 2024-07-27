import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import type { PublicKey } from '../../lib/public-key'
import type { PublicKeys } from '../../lib/public-keys'
import { Items } from '../../lib/items'
import { messages } from '../../lib/messages'
import { state, useNotice } from './state'
import { DeleteButton } from './DeleteButton'
import { UserID } from './UserID'
import { Fingerprint } from './Fingerprint'
import { ExportKey } from './ExportKey'

const pageTitle = (key: PublicKeys): string => {
  if (key.size <= 0) return messages._openPgpPublicKeyEncryptionFrontend
  return messages._publicKeysTitle(key.size)
}

export const PublicKeyView: preact.FunctionComponent<{
  children?: never
}> = () => {
  const keyring = useNotice(state.keyring)
  useEffect(() => {
    if (keyring.size <= 0) {
      document.title = messages._openPgpPublicKeyEncryptionFrontend
    } else {
      document.title = messages._openPgpPublicKeys(keyring.size)
    }
  }, [keyring])
  const validKeys = useMemo(() => keyring.validKeys(), [keyring])
  const [unchecked, setUnchecked] = useState(Items.from<PublicKey>([]))
  const checkedKeys = useMemo(() => {
    return validKeys.delete(Array.from(unchecked, i => i.fingerprint))
  }, [validKeys, unchecked])
  useEffect(() => {
    state.setProcessor(checkedKeys)
  }, [checkedKeys])
  const allChecked = useMemo(() => {
    return Array.from(validKeys).every(i => !unchecked.has(i))
  }, [validKeys, unchecked])
  const onCheckAll = useCallback((): void => {
    setUnchecked(old => (allChecked ? old.add(validKeys) : Items.from([])))
  }, [allChecked, validKeys])
  const onCheck = (key: PublicKey) => (): void => {
    setUnchecked(old => (old.has(key) ? old.delete(key) : old.add([key])))
  }
  const deleteKey = (key: PublicKey) => (): void => {
    setUnchecked(old => old.delete(key))
    state.run([old => old.delete([key.fingerprint])], { scroll: false })
  }
  return (
    <>
      <p className="openpgp-page-title">{pageTitle(keyring)}</p>
      {keyring.size > 0 && (
        <>
          <p>{messages._publicKeysExplanation1}</p>
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    name="all"
                    title={messages._selectAll}
                    checked={allChecked}
                    onClick={onCheckAll}
                  />
                </th>
                <th className="openpgp-column-wide">{messages._owner}</th>
                <th />
                <th>{messages._fingerprint}</th>
                <th>
                  <ExportKey pgpKey={keyring} />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from(keyring, key => (
                <tr key={key}>
                  <td>
                    <input
                      type="checkbox"
                      name="keys"
                      checked={key.features.valid && !unchecked.has(key)}
                      disabled={!key.features.valid}
                      onClick={onCheck(key)}
                    />
                  </td>
                  <td>
                    <UserID pgpKey={key} />{' '}
                  </td>
                  <td>
                    <DeleteButton onClick={deleteKey(key)} />
                  </td>
                  <td>
                    <Fingerprint pgpKey={key} />
                  </td>
                  <td>
                    <ExportKey pgpKey={key} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {messages._publicKeysExplanation2(checkedKeys.features)}
    </>
  )
}

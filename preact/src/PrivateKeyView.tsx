import { useCallback, useEffect, useState } from 'preact/hooks'
import type { PrivateKey } from '../../lib/private-key'
import { messages } from '../../lib/messages'
import { state } from './state'
import { Anchor } from './Anchor'
import { Form } from './Form'
import { UserID } from './UserID'
import { Fingerprint } from './Fingerprint'
import { ExportKey } from './ExportKey'
import { openKeyring } from './Menu'

const PrivateKeyInfo: preact.FunctionComponent<{
  pgpKey: PrivateKey
}> = ({ pgpKey: key }) => {
  const [changePassword, setChangePassword] = useState(false)
  const toggleChangePassword = useCallback((): void => {
    setChangePassword(old => !old)
  }, [])
  const encryptKey = useCallback(
    (data: { passphrase: string }): void => {
      state.run([key.encryptKey(data.passphrase)], { scroll: false })
    },
    [key]
  )
  const exportPrivateKey = useCallback((): void => {
    state.run([key.armor(true)])
  }, [key])
  const revokeKey = useCallback((): void => {
    state.run([key.createRevokeCert()])
  }, [key])
  return (
    <>
      <table>
        <tbody>
          <tr>
            <th>{messages._owner}</th>
            <td className="openpgp-column-wide">
              <UserID pgpKey={key} />
            </td>
          </tr>
          <tr>
            <th>{messages._fingerprint}</th>
            <td>
              <Fingerprint pgpKey={key} /> <ExportKey pgpKey={key} />
            </td>
          </tr>
          <tr>
            <th>{messages._decryption}</th>
            <td>
              {!key.features.encryption
                ? messages._notAvailable
                : key.isDecrypted()
                  ? messages._availableDragAndDropAnEncryptedFileOnThisPage
                  : messages._availableButNotReady}
            </td>
          </tr>
          <tr>
            <th>{messages._signing}</th>
            <td>
              {!key.features.signing
                ? messages._notAvailable
                : key.isDecrypted()
                  ? messages._availableDragAndDropAFileOnThisPage
                  : messages._availableButNotReady}
            </td>
          </tr>
          <tr>
            <th>{messages._certification}</th>
            <td>
              {key.isDecrypted()
                ? messages._availableDragAndDropAKeyFileOnThisPage
                : messages._availableButNotReady}
            </td>
          </tr>
          <tr>
            <th>{messages._commands}</th>
            <td>
              <button onClick={exportPrivateKey}>
                {messages._savePrivateKeyInFile}
              </button>
              {key.isDecrypted() && (
                <>
                  {' '}
                  <button onClick={toggleChangePassword}>
                    {messages._changePassword}
                  </button>{' '}
                  <button onClick={revokeKey}>
                    {messages._issueARevocationCertificate}
                  </button>
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      {changePassword && (
        <Form
          id="openpgp-form-encrypt-key"
          fields={
            [
              {
                key: 'passphrase',
                label: messages._newPassword,
                type: 'password'
              }
            ] as const
          }
          submit={messages._changePassword}
          onSubmit={encryptKey}
        />
      )}
    </>
  )
}

export const PrivateKeyView: preact.FunctionComponent<{
  privateKey: PrivateKey
}> = ({ privateKey }) => {
  useEffect(() => {
    document.title = messages._openPgpPrivateKey(privateKey.keyID)
  }, [privateKey])
  const decryptKey = useCallback(
    (data: { passphrase: string }): void => {
      const task = privateKey
        .decryptKey(data.passphrase)
        .catch((e: unknown) => {
          state.run([privateKey.clone()], { scroll: false, replace: true })
          throw e
        })
      state.run([task], { scroll: false, replace: true })
    },
    [privateKey]
  )
  return (
    <>
      <p className="openpgp-page-title">{messages._privateKeyTitle}</p>
      <p>
        {messages._privateKeyExplanation1(
          <Anchor onClick={openKeyring}>{messages._publicKey}</Anchor>
        )}
      </p>
      <PrivateKeyInfo pgpKey={privateKey} />
      {privateKey.isDecrypted() || (
        <>
          <p>{messages._privateKeyExplanation2}</p>
          <Form
            id="openpgp-form-decrypt-key"
            fields={
              [
                {
                  key: 'passphrase',
                  label: messages._passwordOfThisKey,
                  type: 'password'
                }
              ] as const
            }
            submit={messages._openPrivateKey}
            onSubmit={decryptKey}
          />
        </>
      )}
    </>
  )
}

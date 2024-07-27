import { type VoidComponent, Show, createEffect, createSignal } from 'solid-js'
import type { PrivateKey } from '../../lib/private-key'
import { messages } from '../../lib/messages'
import { state } from './state'
import { Anchor } from './Anchor'
import { Form } from './Form'
import { UserID } from './UserID'
import { Fingerprint } from './Fingerprint'
import { ExportKey } from './ExportKey'
import { openKeyring } from './Menu'

const PrivateKeyInfo: VoidComponent<{
  key: PrivateKey
}> = props => {
  const [getChangePassword, setChangePassword] = createSignal(false)
  const revokeKey = (): void => {
    state.run([props.key.createRevokeCert()])
  }
  const toggleChangePassword = (): void => {
    setChangePassword(old => !old)
  }
  const exportPrivateKey = (): void => {
    state.run([props.key.armor(true)])
  }
  const encryptKey = (data: { passphrase: string }): void => {
    state.run([props.key.encryptKey(data.passphrase)], { scroll: false })
  }
  return (
    <>
      <table>
        <tbody>
          <tr>
            <th>{messages._owner}</th>
            <td class="openpgp-column-wide">
              <UserID key={props.key} />
            </td>
          </tr>
          <tr>
            <th>{messages._fingerprint}</th>
            <td>
              <Fingerprint key={props.key} /> <ExportKey key={props.key} />
            </td>
          </tr>
          <tr>
            <th>{messages._decryption}</th>
            <td>
              <Show
                when={props.key.features.encryption}
                fallback={messages._notAvailable}
              >
                <Show
                  when={props.key.isDecrypted()}
                  fallback={messages._availableButNotReady}
                >
                  {messages._availableDragAndDropAnEncryptedFileOnThisPage}
                </Show>
              </Show>
            </td>
          </tr>
          <tr>
            <th>{messages._signing}</th>
            <td>
              <Show
                when={props.key.features.signing}
                fallback={messages._notAvailable}
              >
                <Show
                  when={props.key.isDecrypted()}
                  fallback={messages._availableButNotReady}
                >
                  {messages._availableDragAndDropAFileOnThisPage}
                </Show>
              </Show>
            </td>
          </tr>
          <tr>
            <th>{messages._certification}</th>
            <td>
              <Show
                when={props.key.isDecrypted()}
                fallback={messages._availableButNotReady}
              >
                {messages._availableDragAndDropAKeyFileOnThisPage}
              </Show>
            </td>
          </tr>
          <tr>
            <th>{messages._commands}</th>
            <td>
              <button onClick={exportPrivateKey}>
                {messages._savePrivateKeyInFile}
              </button>
              <Show when={props.key.isDecrypted()}>
                {' '}
                <button onClick={toggleChangePassword}>
                  {messages._changePassword}
                </button>{' '}
                <button onClick={revokeKey}>
                  {messages._issueARevocationCertificate}
                </button>
              </Show>
            </td>
          </tr>
        </tbody>
      </table>
      <Show when={getChangePassword()}>
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
      </Show>
    </>
  )
}

export const PrivateKeyView: VoidComponent<{
  privateKey: PrivateKey
}> = props => {
  createEffect(() => {
    document.title = messages._openPgpPrivateKey(props.privateKey.keyID)
  })
  const decryptKey = (data: { passphrase: string }): void => {
    const key = props.privateKey
    const task = key.decryptKey(data.passphrase).catch((e: unknown) => {
      state.run([key.clone()], { scroll: false, replace: true })
      throw e
    })
    state.run([task], { scroll: false, replace: true })
  }
  return (
    <>
      <p class="openpgp-page-title">{messages._privateKeyTitle}</p>
      <p>
        {messages._privateKeyExplanation1(
          <Anchor onClick={openKeyring}>{messages._publicKey}</Anchor>
        )}
      </p>
      <PrivateKeyInfo key={props.privateKey} />
      <Show when={!props.privateKey.isDecrypted()}>
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
      </Show>
    </>
  )
}

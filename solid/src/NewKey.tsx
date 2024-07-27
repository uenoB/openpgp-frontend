import { type VoidComponent, onMount } from 'solid-js'
import { PrivateKey } from '../../lib/private-key'
import { messages } from '../../lib/messages'
import { state } from './state'
import { Form } from './Form'

export const NewKey: VoidComponent = () => {
  onMount(() => {
    document.title = messages._openPgpNewKeyPair
  })
  const onSubmit = (
    data: Record<'name' | 'email' | 'passphrase', string>
  ): void => {
    const task = PrivateKey.generate(data).then(
      async key => await key.decryptKey(data.passphrase)
    )
    state.run([task], { scroll: false })
  }
  const fields = [
    { key: 'name', label: messages._ownerName },
    { key: 'email', label: messages._email },
    { key: 'passphrase', label: messages._password, type: 'password' }
  ] as const
  return (
    <>
      <p class="openpgp-page-title">
        {messages._createANewPublicPrivateKeyPair}
      </p>
      <Form
        id="openpgp-form-newkey"
        fields={fields}
        submit={messages._generateANewKey}
        validate={data => PrivateKey.checkGenerate(data)}
        onSubmit={onSubmit}
      />
    </>
  )
}

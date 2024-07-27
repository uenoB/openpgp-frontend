import { useCallback, useEffect } from 'preact/hooks'
import { PrivateKey } from '../../lib/private-key'
import { messages } from '../../lib/messages'
import { state } from './state'
import { Form } from './Form'

export const NewKey: preact.FunctionComponent = () => {
  useEffect(() => {
    document.title = messages._openPgpNewKeyPair
  }, [])
  type R = Record<'name' | 'email' | 'passphrase', string>
  const onSubmit = useCallback((data: R): void => {
    const task = PrivateKey.generate(data).then(
      async key => await key.decryptKey(data.passphrase)
    )
    state.run([task], { scroll: false })
  }, [])
  const fields = [
    { key: 'name', label: messages._ownerName },
    { key: 'email', label: messages._email },
    { key: 'passphrase', label: messages._password, type: 'password' }
  ] as const
  return (
    <>
      <p className="openpgp-page-title">
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

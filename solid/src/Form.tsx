import { type JSX, For, createSignal, onMount } from 'solid-js'

interface Field<Key> {
  readonly key: Key
  readonly label: string
  readonly type?: 'text' | 'password' | undefined
}

export const Form = <Key extends string>(props: {
  id: string
  fields: ReadonlyArray<Field<Key>>
  submit?: string | undefined
  validate?: ((data: Record<Key, string>) => boolean) | undefined
  onSubmit: (data: Record<Key, string>) => void
  children?: never
}): JSX.Element => {
  const [ready, setReady] = createSignal<boolean>(false)
  const [submitted, setSubmitted] = createSignal<boolean>(false)
  let formRef: HTMLFormElement
  const inputElement = (key: Key): HTMLInputElement =>
    formRef.elements.namedItem(key) as HTMLInputElement
  const getFormData = (): Record<Key, string> => {
    const data: Partial<Record<Key, string>> = {}
    for (const { key } of props.fields) data[key] = inputElement(key).value
    return data as Record<Key, string>
  }
  const isValid = (data: Record<Key, string>): boolean =>
    props.validate == null || props.validate(data)
  const onInput = (): void => {
    setReady(isValid(getFormData()))
  }
  const onSubmitForm = (e: Event): void => {
    e.preventDefault()
    if (submitted()) return
    const data = getFormData()
    const valid = isValid(data)
    setReady(valid)
    if (!valid) return
    setSubmitted(true)
    for (const { key, type } of props.fields) {
      if (type !== 'password') continue
      inputElement(key).value = ''
    }
    props.onSubmit(data)
  }
  onMount(onInput)
  return (
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    <form id={props.id} onSubmit={onSubmitForm} ref={formRef!}>
      <table>
        <tbody>
          <For each={props.fields}>
            {field => {
              const id = `${props.id}-${field.key}`
              return (
                <tr>
                  <th>
                    <label for={id}>{field.label}</label>
                  </th>
                  <td class="openpgp-column-wide">
                    <input
                      id={id}
                      type={field.type ?? 'text'}
                      name={field.key}
                      disabled={submitted()}
                      onInput={onInput}
                    />
                  </td>
                </tr>
              )
            }}
          </For>
        </tbody>
      </table>
      <div>
        <input
          type="submit"
          value={props.submit ?? 'submit'}
          disabled={submitted() || !ready()}
        />
      </div>
    </form>
  )
}

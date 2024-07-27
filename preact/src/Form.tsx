import { useCallback, useEffect, useState, useRef } from 'preact/hooks'

interface Field<Key> {
  readonly key: Key
  readonly label: string
  readonly type?: 'text' | 'password' | undefined
}

const inputElement = (
  formRef: { current: HTMLFormElement | null },
  key: string
): HTMLInputElement | undefined =>
  formRef.current?.elements.namedItem(key) as HTMLInputElement | undefined

export const Form = <Key extends string>(
  props: preact.RenderableProps<{
    id: string
    fields: ReadonlyArray<Field<Key>>
    submit?: string | undefined
    validate?: ((data: Record<Key, string>) => boolean) | undefined
    onSubmit: (data: Record<Key, string>) => void
    children?: never
  }>
): preact.VNode => {
  const { fields, validate, onSubmit } = props
  const [ready, setReady] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const getFormData = useCallback((): Record<Key, string> => {
    const data: Partial<Record<Key, string>> = {}
    for (const { key } of fields) {
      data[key] = inputElement(formRef, key)?.value ?? ''
    }
    return data as Record<Key, string>
  }, [fields])
  const isValid = useCallback(
    (data: Record<Key, string>): boolean => {
      return validate == null || validate(data)
    },
    [validate]
  )
  const onInput = useCallback((): void => {
    setReady(isValid(getFormData()))
  }, [isValid, getFormData])
  const onSubmitForm = useCallback(
    (e: Event): void => {
      e.preventDefault()
      if (submitted) return
      const data = getFormData()
      const valid = isValid(data)
      setReady(valid)
      if (!valid) return
      setSubmitted(true)
      for (const { key, type } of fields) {
        if (type !== 'password') continue
        const input = inputElement(formRef, key)
        if (input != null) input.value = ''
      }
      onSubmit(data)
    },
    [fields, onSubmit, submitted, isValid, getFormData]
  )
  useEffect(() => {
    onInput()
  }, [onInput])
  return (
    <form id={props.id} onSubmit={onSubmitForm} ref={formRef}>
      <table>
        <tbody>
          {props.fields.map(field => {
            const id = `${props.id}-${field.key}`
            return (
              <tr key={field.key}>
                <th>
                  <label htmlFor={id}>{field.label}</label>
                </th>
                <td className="openpgp-column-wide">
                  <input
                    id={id}
                    type={field.type ?? 'text'}
                    name={field.key}
                    disabled={submitted}
                    onInput={onInput}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div>
        <input
          type="submit"
          value={props.submit ?? 'submit'}
          disabled={submitted || !ready}
        />
      </div>
    </form>
  )
}

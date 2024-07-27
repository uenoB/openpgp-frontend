import type { VoidComponent } from 'solid-js'
import { type Data, fileData } from '../../lib/data'

export const FileInput: VoidComponent<{
  onSelect?: ((data: Data[][]) => void) | undefined
  multiple?: boolean | undefined
}> = props => {
  const onChange = (e: Event): void => {
    e.preventDefault()
    const input = e.target as HTMLInputElement
    if (input.files == null) return
    const files = [Array.from(input.files, fileData)]
    input.value = ''
    props.onSelect?.(files)
  }
  return (
    <input
      class="openpgp-file-input"
      type="file"
      onChange={onChange}
      disabled={props.onSelect == null}
      multiple={props.multiple ?? false}
    />
  )
}

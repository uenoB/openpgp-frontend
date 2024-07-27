import { useCallback } from 'preact/hooks'
import { type Data, fileData } from '../../lib/data'

export const FileInput: preact.FunctionComponent<{
  onSelect?: ((data: Data[][]) => void) | undefined
  multiple?: boolean | undefined
}> = ({ onSelect, multiple }) => {
  const onChange = useCallback(
    (e: Event): void => {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      if (input.files == null) return
      const files = [Array.from(input.files, fileData)]
      input.value = ''
      onSelect?.(files)
    },
    [onSelect]
  )
  return (
    <input
      className="openpgp-file-input"
      type="file"
      onChange={onChange}
      disabled={onSelect == null}
      multiple={multiple ?? false}
    />
  )
}

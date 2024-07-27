import { useCallback, useState } from 'preact/hooks'
import type { Awaitable } from '../../lib/util'
import { type Data, fetchData, fileData } from '../../lib/data'
import type { Files } from './state'

const listData = (items: DataTransferItemList): Files =>
  Array.from(items, (item): Awaitable<Array<Awaitable<Data>>> => {
    const file = item.getAsFile()
    if (file != null) return [fileData(file)]
    if (item.kind === 'string' && item.type === 'text/uri-list') {
      return new Promise<Array<Promise<Data>>>(resolve => {
        item.getAsString(text => {
          const lines = text.split('\r\n').filter(i => !i.startsWith('#'))
          resolve(lines.map(async uri => await fetchData(uri)))
        })
      })
    }
    return []
  })

export const Droppable: preact.FunctionComponent<{
  className?: string | undefined
  onDrop?: ((files: Files) => void) | undefined
  children: preact.ComponentChildren
}> = ({ className, onDrop, children }) => {
  const [drag, setDrag] = useState(false)
  const onDragOver = useCallback(
    (e: Event): void => {
      e.preventDefault()
      setDrag(onDrop != null)
    },
    [onDrop]
  )
  const onDragEnter = useCallback((): void => {
    setDrag(onDrop != null)
  }, [onDrop])
  const onDropHandler = useCallback(
    (e: DragEvent): void => {
      e.preventDefault()
      setDrag(false)
      if (e.dataTransfer != null) onDrop?.(listData(e.dataTransfer.items))
    },
    [onDrop]
  )
  const onDragLeave = useCallback((): void => {
    setDrag(false)
  }, [])
  return (
    <div
      className={className}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDropHandler}
    >
      {children}
      {drag && (
        <div className="openpgp-drag-overlay" onDragLeave={onDragLeave}>
          <div>
            <p>Drop Here</p>
          </div>
        </div>
      )}
    </div>
  )
}

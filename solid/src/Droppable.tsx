import type { ParentComponent } from 'solid-js'
import { Show, createSignal } from 'solid-js'
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

export const Droppable: ParentComponent<{
  class?: string
  onDrop?: ((files: Files) => void) | undefined
}> = props => {
  const [drag, setDrag] = createSignal(false)
  const onDragOver = (e: Event): void => {
    e.preventDefault()
    setDrag(props.onDrop != null)
  }
  const onDragEnter = (): void => {
    setDrag(props.onDrop != null)
  }
  const onDrop = (e: DragEvent): void => {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer != null) props.onDrop?.(listData(e.dataTransfer.items))
  }
  const onDragLeave = (): void => {
    setDrag(false)
  }
  return (
    <div
      class={props.class}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
    >
      {props.children}
      <Show when={drag()}>
        <div class="openpgp-drag-overlay" onDragLeave={onDragLeave}>
          <div>
            <p>Drop Here</p>
          </div>
        </div>
      </Show>
    </div>
  )
}

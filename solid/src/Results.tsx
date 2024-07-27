import type { VoidComponent, JSX } from 'solid-js'
import { For, Show, createMemo, onCleanup, onMount } from 'solid-js'
import { type Result, type Done, getResults, state } from './state'
import { DeleteButton } from './DeleteButton'

const infoToHTML = (Src: string | VoidComponent): JSX.Element => {
  if (typeof Src !== 'string') return <Src />
  const lines = Src.split(/^/m)
  // eslint-disable-next-line solid/prefer-for
  return <p>{lines.map((line, i) => (i > 0 ? [<br />, line] : line))}</p>
}

const CloseButton: VoidComponent<{ item: Result }> = props => (
  <DeleteButton
    onClick={() => {
      state.delete(props.item)
    }}
  />
)

const Download: VoidComponent<{ done: Done }> = props => {
  const url = createMemo<string>(old => {
    if (old != null) URL.revokeObjectURL(old)
    return URL.createObjectURL(props.done.data)
  })
  onCleanup(() => {
    URL.revokeObjectURL(url())
  })
  return (
    <>
      <Show when={props.done.kind}>
        {kind => <span class="openpgp-download-kind">{kind()}</span>}
      </Show>
      <a
        class="openpgp-new-item"
        href={url()}
        download={props.done.download}
        type={props.done.contentType}
        title={props.done.title ?? ''}
      >
        {props.done.download}
      </a>
    </>
  )
}

export const Results: VoidComponent<{ class?: string | undefined }> = props => (
  <ul class={props.class}>
    <For each={Array.from(getResults())}>
      {item => {
        let elem: HTMLLIElement
        onMount(() => {
          const scroll = item.scroll ?? true
          if (!scroll) return
          window.requestAnimationFrame(() => {
            elem.scrollIntoView({ block: 'end', behavior: 'smooth' })
          })
        })
        if (item.result == null) {
          return (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            <li class="openpgp-result-runnning" ref={elem!}>
              <p>
                <span class="openpgp-wait">processing...</span>
              </p>
            </li>
          )
        } else if (item.result.data != null) {
          return (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            <li class="openpgp-new-item openpgp-result-done" ref={elem!}>
              <CloseButton item={item} />
              <Download done={item.result} />
            </li>
          )
        } else {
          const classList = {
            'openpgp-result-info': item.result.error !== true,
            'openpgp-result-error': item.result.error === true,
            'openpgp-new-item': true
          }
          return (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            <li classList={classList} ref={elem!}>
              <CloseButton item={item} />
              {infoToHTML(item.result.info)}
            </li>
          )
        }
      }}
    </For>
  </ul>
)

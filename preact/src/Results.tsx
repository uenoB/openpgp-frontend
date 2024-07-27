import { useCallback, useEffect, useState } from 'preact/hooks'
import { type Result, type Done, state } from './state'
import { DeleteButton } from './DeleteButton'

const infoToHTML = (Src: string | preact.ComponentType): preact.VNode => {
  if (typeof Src !== 'string') return <Src />
  const lines = Src.split(/^/m)
  // eslint-disable-next-line react/jsx-key
  return <p>{lines.map((line, i) => (i > 0 ? [<br />, line] : line))}</p>
}

const CloseButton: preact.FunctionComponent<{
  item: Result
  children?: never
}> = ({ item }) => {
  const onClick = useCallback(() => {
    state.delete(item)
  }, [item])
  return <DeleteButton onClick={onClick} />
}

const Download: preact.FunctionComponent<{
  done: Done
  children?: never
}> = ({ done }) => {
  const [href, setHref] = useState<string>()
  useEffect(() => {
    const url = URL.createObjectURL(done.data)
    setHref(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [done])
  return (
    <>
      {done.kind != null && (
        <span className="openpgp-download-kind">{done.kind}</span>
      )}
      <a
        className="openpgp-new-item"
        href={href}
        download={done.download}
        type={done.contentType}
        title={done.title ?? ''}
      >
        {done.download}
      </a>
    </>
  )
}

const scroll = (node: Element | null): void => {
  if (node == null) return
  window.requestAnimationFrame(() => {
    node.scrollIntoView({ block: 'end', behavior: 'smooth' })
  })
}

export const Results: preact.FunctionComponent<{
  className?: string | undefined
  children?: never
}> = ({ className }) => {
  const [results, setResults] = useState(state.results.value)
  useEffect(() => {
    state.results.add(setResults)
    return () => {
      state.results.delete(setResults)
    }
  }, [])
  return (
    <ul className={className}>
      {Array.from(results, item => {
        const ref = item.scroll !== false ? { ref: scroll } : undefined
        if (item.result == null) {
          return (
            <li className="openpgp-result-runnning" key={item} {...ref}>
              <p>
                <span className="openpgp-wait">processing...</span>
              </p>
            </li>
          )
        } else if (item.result.data != null) {
          return (
            <li className="openpgp-result-done" key={item} {...ref}>
              <CloseButton item={item} />
              <Download done={item.result} />
            </li>
          )
        } else {
          const classes: string[] = ['openpgp-new-item']
          if (item.result.error !== true) {
            classes.push('openpgp-result-info')
          } else {
            classes.push('openpgp-result-error')
          }
          return (
            <li className={classes.join(' ')} key={item} {...ref}>
              <CloseButton item={item} />
              {infoToHTML(item.result.info)}
            </li>
          )
        }
      })}
    </ul>
  )
}

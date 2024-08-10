import { useEffect, useState } from 'preact/hooks'
import { type Notice, type Result as ResultTy, State } from '../../lib/state'
export type { Done, Files, Processor } from '../../lib/state'

export type Result = ResultTy<preact.ComponentType>

export const state = new State<preact.ComponentType>()

export const useNotice = <X>(notice: Notice<X>): X => {
  const [value, setValue] = useState(notice.value)
  useEffect(() => {
    notice.add(setValue)
    return () => {
      notice.delete(setValue)
    }
  }, [])
  return value
}

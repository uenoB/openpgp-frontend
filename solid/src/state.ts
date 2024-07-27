import { type VoidComponent, createSignal } from 'solid-js'
import { type Result as ResultTy, State } from '../../lib/state'
export type { Done, Files } from '../../lib/state'

export type Result = ResultTy<VoidComponent>

export const state = new State<VoidComponent>()

const [getHash, setHash] = createSignal(state.hash.value)
const [getKeyring, setKeyring] = createSignal(state.keyring.value)
const [getMode, setMode] = createSignal(state.mode.value)
const [getResults, setResults] = createSignal(state.results.value)
const [getOpenFile, setOpenFile] = createSignal(state.openFile.value)

state.hash.add(setHash)
state.keyring.add(setKeyring)
state.mode.add(setMode)
state.results.add(setResults)
state.openFile.add(setOpenFile)

export { getHash, getKeyring, getMode, getResults, getOpenFile }

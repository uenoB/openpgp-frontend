import { type Awaitable, addHash } from './util'
import { decodeBase64, encodeBase64 } from './binary'
import { type Data, readAll, fetchData } from './data'
import type { Key } from './key'
import { PublicKeys } from './public-keys'
import { PrivateKey } from './private-key'
import { Items } from './items'

const keyToHash = (key: Key): string => `#${encodeBase64(key.serialize())}`

export type Mode =
  | undefined // public keys
  | '#.' // new key pair
  | PrivateKey

export interface Info<Component = never> {
  readonly data?: never // distinct from Data
  readonly error?: boolean | undefined
  readonly info: string | Component
}

export interface Done {
  readonly data: Blob
  readonly download: string
  readonly contentType: string
  readonly title: string | undefined
  readonly kind: string | undefined
}

interface ResultCommon {
  readonly scroll?: boolean | undefined
  readonly replace?: boolean | undefined
}

interface ResultDone<Component> extends ResultCommon {
  readonly result: Info<Component> | Done
}

interface ResultWorking extends ResultCommon {
  readonly result?: never // distinct from ResultDone
  readonly promise: Promise<void>
}

export type Result<Component = never> = ResultWorking | ResultDone<Component>

export type Task<Component = never> =
  | Data
  | Info<Component>
  | ((keyring: PublicKeys) => Awaitable<PublicKeys>)
  | PrivateKey
  | undefined

export interface Processor {
  process: (input: Data) => Awaitable<Iterable<Awaitable<Task>>>
}

export type Files = Iterable<Awaitable<Iterable<Awaitable<Data>>>>
type OpenFile = (files: Files) => void

class Notifier<X> {
  value: X
  readonly listeners = new Set<(value: () => X) => unknown>()

  constructor(value: X) {
    this.value = value
  }

  set(value: X): void {
    this.value = value
    const update = (): X => value
    for (const i of this.listeners) i(update)
  }
}

class Notice<X> {
  readonly #notifier: Notifier<X>

  constructor(notifier: Notifier<X>) {
    this.#notifier = notifier
  }

  get value(): X {
    return this.#notifier.value
  }

  add(f: (value: () => X) => unknown): void {
    this.#notifier.listeners.add(f)
    f(() => this.#notifier.value)
  }

  delete(f: (value: () => X) => unknown): void {
    this.#notifier.listeners.delete(f)
  }
}

export type { Notice }

export class State<Component> {
  readonly #hash = new Notifier<string>('')
  readonly #keyring = new Notifier(PublicKeys.empty)
  readonly #mode = new Notifier<Mode>(undefined)
  readonly #results = new Notifier(Items.from<Result<Component>>([]))
  readonly #openFile = new Notifier<OpenFile | undefined>(undefined)

  readonly hash = new Notice(this.#hash)
  readonly keyring = new Notice(this.#keyring)
  readonly mode = new Notice(this.#mode)
  readonly results = new Notice(this.#results)
  readonly openFile = new Notice(this.#openFile)

  #lastUpdateKeyring = Promise.resolve<[unknown] | undefined>(undefined)

  async #updateKeyring(
    update: (keyring: PublicKeys) => Awaitable<PublicKeys>
  ): Promise<void> {
    this.#lastUpdateKeyring = this.#lastUpdateKeyring.then(async () => {
      try {
        this.#keyring.set(await update(this.#keyring.value))
        return undefined
      } catch (error) {
        return [error]
      }
    })
    await this.#lastUpdateKeyring.then(result => {
      if (result != null) throw result[0]
    })
  }

  #save(hash: string, replace: boolean | undefined): void {
    if (replace !== true) {
      window.history.pushState(null, '', hash)
    } else if (hash !== addHash(window.location.hash)) {
      window.history.replaceState(null, '', hash)
    }
    this.#hash.set(hash)
  }

  async #gotoMode(
    mode: Mode | ((keyring: PublicKeys) => Awaitable<PublicKeys>),
    replace: boolean | undefined
  ): Promise<void> {
    if (typeof mode === 'function') {
      this.#mode.set(undefined)
      this.setProcessor(undefined)
      await this.#updateKeyring(async old => {
        const newKeyring = await mode(old)
        this.#save(keyToHash(newKeyring), replace)
        this.setProcessor(newKeyring)
        return newKeyring
      })
    } else if (typeof mode === 'object') {
      this.#save(keyToHash(mode), replace)
      this.#mode.set(mode)
      this.setProcessor(mode)
      await this.#updateKeyring(async old => await old.importKeys([mode]))
    } else {
      this.#save(mode ?? '#', replace)
      this.#mode.set(mode)
      this.setProcessor(undefined)
    }
  }

  async processHash(hash: string): Promise<void> {
    const runOptions = { scroll: false, replace: true }
    this.#hash.set(hash)
    if (hash === '') {
      this.run([() => PublicKeys.empty], runOptions)
    } else if (hash === '#.') {
      await this.#gotoMode(hash, true)
    } else if (hash.startsWith('#/')) {
      const data = await fetchData(hash.slice(1))
      const tasks = await PublicKeys.empty.process(data)
      this.run(tasks, runOptions)
    } else if (hash.startsWith('#')) {
      const data = decodeBase64(hash.slice(1))
      this.run(await PublicKeys.empty.process({ data }), runOptions)
    } else {
      throw Error('hash does not start with a hash')
    }
  }

  async #runTask(
    oldItem: () => ResultWorking,
    task: Awaitable<Task<Component>>
  ): Promise<void> {
    let result: Info<Component> | Done | undefined
    try {
      const output = await task
      if (typeof output === 'function' || output instanceof PrivateKey) {
        await this.#gotoMode(output, oldItem().replace)
      } else if (output?.data != null) {
        const contentType = output.contentType ?? 'application/octet-stream'
        const data = new Blob(await readAll(output), { type: contentType })
        const lines = [`${data.size} bytes.`]
        if (output.title != null) lines.push(output.title)
        const title = lines.join('\n')
        const download = output.filename ?? 'unnamed'
        result = { data, download, contentType, title, kind: output.kind }
      } else {
        result = output
      }
    } catch (error) {
      console.error(error)
      const info = error instanceof Error ? error.message : String(error)
      result = { error: true, info }
    }
    if (result == null) {
      this.#results.set(this.#results.value.delete(oldItem()))
    } else {
      const old = oldItem()
      const error = result.data == null && result.error === true
      const item = { result, scroll: error || old.scroll }
      this.#results.set(this.#results.value.replace(old, item))
    }
  }

  run(
    tasks: Iterable<Awaitable<Task<Component>>>,
    options?: ResultCommon | undefined
  ): void {
    const newItems = Array.from(tasks, task => {
      const getItem = (): ResultWorking => item
      const promise = this.#runTask(getItem, task)
      const item: ResultWorking = { ...options, promise }
      return item
    })
    this.#results.set(this.#results.value.add(newItems))
  }

  fail(reason: unknown): void {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    this.run([Promise.reject(reason)])
  }

  delete(result: Result<Component>): void {
    this.#results.set(this.#results.value.delete(result))
  }

  #openFileCache: WeakMap<Processor, OpenFile> | undefined

  setProcessor(processor: Processor | undefined): void {
    if (processor == null) {
      this.#openFile.set(undefined)
    } else {
      if (this.#openFileCache != null) {
        const openFile = this.#openFileCache.get(processor)
        if (openFile != null) {
          this.#openFile.set(openFile)
          return
        }
      }
      const openFile: OpenFile = files => {
        const task = async (): Promise<void> => {
          for (const array of files) {
            for (const data of await array) {
              this.run(await processor.process(await data))
            }
          }
        }
        task().catch(this.fail.bind(this))
      }
      this.#openFileCache ??= new WeakMap()
      this.#openFileCache.set(processor, openFile)
      this.#openFile.set(openFile)
    }
  }
}

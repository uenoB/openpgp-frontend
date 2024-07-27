import { render as preactRender } from 'preact'
import { App } from './App'

export const render = (element: Element | ShadowRoot): void => {
  preactRender(<App />, element)
}

export { App as default, App } from './App'

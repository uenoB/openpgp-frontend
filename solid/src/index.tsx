import { render as solidRender } from 'solid-js/web'
import { App } from './App'

export const render = (element: Element | ShadowRoot): void => {
  solidRender(() => <App />, element)
}

export { App as default, App } from './App'

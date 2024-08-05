# OpenPGP.js Frontend for Solid

This package provides an [OpenPGP.js] frontend application as a
[Solid] component.

See [repository's README][openpgp-frontend] for details of the application.

This package exports a `App` component and `render` utility function of
the following signature:

```typescript
declare const App: VoidComponent;
declare const render: (element: Element | ShadowRoot) => void;
export { App, App as default, render };
```

This packages provides four forms of the code:

1. `openpgp-frontend-solid`
   is the compiled and minified code.
2. `openpgp-frontend-solid/dist/index.js`
   is the compiled but non-minified code.
3. `openpgp-frontend-solid/dist/index.jsx`
   is non-compiled and non-minified code.
4. `openpgp-frontend-solid/dist/index.min.jsx`
   is non-compiled but minified code.

3 and 4 are suitable for partial hydration.

## License

MIT

[OpenPGP.js]: https://openpgpjs.org
[Solid.js]: https://www.solidjs.com
[openpgp-frontend]: https://github.com/uenoB/openpgp-frontend#readme

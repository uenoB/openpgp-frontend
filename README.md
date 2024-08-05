# OpenPGP.js Frontend

This is the source code of a standalone OpenPGP application available at
[https://uenob.github.io/openpgp-frontend/][github.io].

You can enjoy OpenPGP encryption/decryption only with a web browser.
Once the entire script is loaded in the browser, this application
does not communicate any server at all.
Encryption and decryption occurs just on your web browser by simply
dragging-and-dropping files on which you want to operate.

The application works even on `file://` URL.
Download the single HTML file of this application, open it,
and you can enjoy OpenPGP encryption/decryption locally on your computer.

This application depends on [OpenPGP.js] licensed under the terms of LGPL
and [Solid.js] of MIT license.

## How to Build

1. `git clone`
2. `pnpm install`
3. `cd pages && pnpm build`

Then you will find `pages/_site/index.html`, which is the all-in-one
HTML file of this application.
The HTML file does not include [OpenPGP.js] to prevent the infection of LGPL.
To obtain the HTML file including OpenPGP.js, do the following instead of
the step 3 above:

```bash
cd pages && node build.js all
```

## Embedding It in Your Project

This application is written by using either [Solid.js] or [Preact].
You can import this application as a Solid or Preact component into
your project by installing a NPM package.
Installation can be done by one of the following commmand:

```bash
npm install openpgp-frontend-preact
```

or

```bash
npm install openpgp-frontend-solid
```

See [preact/README.md](preact/README.md) or [solid/README.md](solid/README.md)
for details of these packages.

## License

MIT

[github.io]: https://uenob.github.io/openpgp-frontend/
[OpenPGP.js]: https://openpgpjs.org
[Preact]: https://preactjs.com
[Solid.js]: https://www.solidjs.com

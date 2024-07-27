import * as fs from 'node:fs'
import * as url from 'node:url'
import * as crypto from 'node:crypto'
import * as vite from 'vite'
import * as parse5 from 'parse5'
import solid from 'vite-plugin-solid'
import htmlMinifier from 'html-minifier-terser'

const cwd = new URL('.', import.meta.url)
const root = new URL('..', cwd)
const dist = new URL('dist/', cwd)
process.chdir(url.fileURLToPath(root))

const getAttrNode = (node, name) => node.attrs?.find(i => i.name === name)

const getAttr = (node, name) => getAttrNode(node, name)?.value

const findNode = (node, name) =>
  node.nodeName === name
    ? [node]
    : (node.childNodes?.map(i => findNode(i, name)).flat() ?? [])

const addText = (node, value) => {
  node.childNodes.push({ nodeName: '#text', value, parentNode: node })
}

const addAttr = (node, name, value) => {
  if (value != null) node.attrs.push({ name, value })
}

const cloneNode = (node, parentNode) => {
  const newNode = { ...node, parentNode }
  if (newNode.childNodes != null) {
    newNode.childNodes = newNode.childNodes.map(i => cloneNode(i, newNode))
  }
  return newNode
}

const cdnRoot = new URL(`https://cdn.jsdelivr.net/npm/`)

const loadFromCDN = (pkgPath, relPath) => {
  const jsonPath = new URL('package.json', pkgPath)
  const json = fs.readFileSync(jsonPath, { encoding: 'utf8' })
  const { name, version } = JSON.parse(json)
  const jsPath = new URL(relPath, pkgPath)
  const js = fs.readFileSync(jsPath, { encoding: 'utf8' })
  const hash = crypto.createHash('sha384').update(js).digest('base64')
  const url = new URL(`${name}@${version}/${relPath}`, cdnRoot)
  return { href: url.href, integrity: `sha384-${hash}` }
}

const loadFile = relPath => {
  const fileName = relPath.startsWith('/')
    ? new URL(relPath.slice(1), dist)
    : new URL(relPath, cwd)
  return fs.readFileSync(fileName, { encoding: 'utf8' })
}

const transformScript = (node, parentNode = null) => {
  switch (getAttr(node, 'type')) {
    case 'module': {
      const src = getAttr(node, 'src')
      if (src == null) break
      const newNode = { ...node, parentNode, attrs: [], childNodes: [] }
      addAttr(newNode, 'type', 'module')
      addText(newNode, loadFile(src))
      return [newNode]
    }
    case 'importmap': {
      const imports = JSON.parse(node.childNodes[0].value).imports
      const newNodes = []
      const importMap = {}
      for (const [name, path] of Object.entries(imports)) {
        const [pkgRelPath, relPath] = path.split(',')
        if (pkgRelPath == null || relPath == null) continue
        const pkgPath = new URL(pkgRelPath, cwd)
        const { href, integrity } = loadFromCDN(pkgPath, relPath)
        const link = { ...node, parentNode, attrs: [], childNodes: [] }
        link.nodeName = link.tagName = 'link'
        addAttr(link, 'rel', 'modulepreload')
        addAttr(link, 'href', href)
        addAttr(link, 'integrity', integrity)
        addAttr(link, 'crossorigin', 'anonymous')
        const script = { ...node, parentNode, attrs: [], childNodes: [] }
        addAttr(script, 'type', 'module')
        addAttr(script, 'src', href)
        addAttr(script, 'integrity', integrity)
        addAttr(script, 'crossorigin', 'anonymous')
        newNodes.push(link, script)
        importMap[name] = href
      }
      const newNode = { ...node, parentNode, attrs: [], childNodes: [] }
      addAttr(newNode, 'type', 'importmap')
      addText(newNode, JSON.stringify({ imports: importMap }))
      return [newNode, ...newNodes]
    }
  }
  return node
}

const transformLink = (node, parentNode = null) => {
  const href = getAttr(node, 'href')
  if (href == null) return node
  switch (getAttr(node, 'rel')) {
    case 'modulepreload': {
      const newNode = { ...node, parentNode, attrs: [], childNodes: [] }
      newNode.nodeName = newNode.tagName = 'script'
      addAttr(newNode, 'type', 'module')
      addAttr(newNode, 'id', getAttr(node, 'id'))
      addText(newNode, loadFile(href))
      return newNode
    }
    case 'stylesheet': {
      const newNode = { ...node, parentNode, attrs: [], childNodes: [] }
      newNode.nodeName = newNode.tagName = 'style'
      addText(newNode, loadFile(href))
      return newNode
    }
    case 'license': {
      const data = '!\n' + loadFile(href)
      return { nodeName: '#comment', data, parentNode }
    }
  }
  return node
}

let insertHead = []

const transform = (node, parentNode = null) => {
  if (node.nodeName === 'script') return transformScript(node, parentNode)
  if (node.nodeName === 'link') return transformLink(node, parentNode)
  const newNode = { ...node, parentNode }
  if (node.childNodes == null) return newNode
  newNode.childNodes = newNode.childNodes.map(i => transform(i, newNode)).flat()
  if (newNode.nodeName === 'head') {
    const index = newNode.childNodes.findIndex(i => i.nodeName === 'script')
    const heads = insertHead.map(i => cloneNode(i, parentNode))
    newNode.childNodes.splice(index, 0, ...heads)
  }
  return newNode
}

const loaderSuffix = process.argv[2] ?? 'all'
const loaderFileName = `loader_${loaderSuffix}.html`

await vite.build({
  build: {
    outDir: url.fileURLToPath(dist),
    assetsInlineLimit: 0,
    minify: false,
    modulePreload: false,
    reportCompressedSize: false,
    rollupOptions: {
      input: [
        url.fileURLToPath(new URL('solid/index.html', root)),
        url.fileURLToPath(new URL(`pages/${loaderFileName}`, root))
      ],
      external: ['openpgp']
    },
    target: 'es2022'
  },
  plugins: [solid()]
})

const indexTree = parse5.parse(loadFile('/solid/index.html'))
const loaderTree = parse5.parse(loadFile(`/pages/${loaderFileName}`))
insertHead = findNode(transform(loaderTree), 'head')[0]?.childNodes ?? []
const newIndexTree = transform(indexTree)

const indexHtml = parse5.serialize(newIndexTree)

let minifiedHtml = await htmlMinifier.minify(indexHtml, {
  collapseWhitespace: true,
  decodeEntities: true,
  removeComments: true,
  sortAttributes: true,
  sortClassName: true,
  minifyCSS: { level: 2 },
  minifyJS: {
    compress: { passes: 2 },
    ecma: 2022,
    mangle: {
      properties: { regex: /^_/ }
    },
    module: true
  }
})

if (loaderSuffix === 'all') {
  const minifiedTree = parse5.parse(minifiedHtml)
  for (const node of findNode(minifiedTree, 'script').slice(1)) {
    const attr = getAttrNode(node, 'type')
    if (attr != null && attr.value === 'module') attr.value = 'inline_module'
  }
  minifiedHtml = parse5.serialize(minifiedTree)
}

fs.mkdirSync(new URL('_site/', cwd), { recursive: true })
fs.writeFileSync(new URL(`_site/index.html`, cwd), minifiedHtml)

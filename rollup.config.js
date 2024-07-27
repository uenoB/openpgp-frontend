import * as fs from 'node:fs'
import * as path from 'node:path'
import resolvePlugin from '@rollup/plugin-node-resolve'
import esbuildPlugin from 'rollup-plugin-esbuild'
import { babel as babelPlugin } from '@rollup/plugin-babel'
import terserPlugin from '@rollup/plugin-terser'
import dtsPlugin from 'rollup-plugin-dts'
import { minify } from 'terser'
import esbuild from 'esbuild'
import babel from '@babel/core'

const banner = dir =>
  `/*! openpgp-frontend-${dir}, Copyright (C) Katsuhiro Ueno, MIT license */`

const external = ['openpgp', 'preact', 'solid-js']
const rollupExternal = external.map(i => RegExp(`^${i}(?:/|$)`))

const cleanupPlugin = outDir => ({
  name: 'cleanup',
  buildStart: () => fs.rmSync(outDir, { recursive: true, force: true })
})

const closeBundlePlugin = (...funcs) => ({
  name: 'closeBundle',
  async closeBundle() {
    for (const [f, ...args] of funcs) await f(...args)
  }
})

const jsxTextCompactPlugin = () => {
  const isElement = node =>
    node?.type === 'JSXElement' || node?.type === 'JSXFragment'
  const isAfterTag = path => {
    const prev = path.getPrevSibling().node
    return (isElement(path.parent) && prev == null) || isElement(prev)
  }
  const isBeforeTag = path => {
    const next = path.getNextSibling().node
    return (isElement(path.parent) && next == null) || isElement(next)
  }
  return {
    visitor: {
      JSXText(path) {
        let s = path.node.value.replace(/\s*\n\s*/g, '\n')
        if (isAfterTag(path)) s = s.replace(/^\n/, '')
        if (isBeforeTag(path)) s = s.replace(/\n$/, '')
        path.node.value = s
      }
    }
  }
}

const checkEsbuildResult = result => {
  if (result.errors.length > 0 || result.warnings.length > 0) {
    throw Error([...result.errors, ...result.warnings].join('\n'))
  }
}

const buildIndexMinJs = async dir => {
  const input = path.join(dir, 'dist/index.js')
  const output = path.join(dir, 'dist/index.min.js')

  console.log(`creating ${output}`)
  const source = fs.readFileSync(input, { encoding: 'utf8' })
  const sourceMap = fs.readFileSync(input + '.map', { encoding: 'utf8' })
  const result = await minify(source, {
    module: true,
    mangle: { properties: /^_/ },
    compress: { passes: 2 },
    sourceMap: {
      content: JSON.parse(sourceMap),
      url: 'index.min.js.map'
    }
  })
  fs.writeFileSync(output, result.code)
  fs.writeFileSync(output + '.map', result.map)
}

const buildIndexJsx = async dir => {
  const input = path.join(dir, 'src/index.tsx')
  const output = path.join(dir, 'dist/index.jsx')

  console.log(`creating ${output}`)
  const result1 = await esbuild.build({
    banner: { js: banner(dir) },
    bundle: true,
    charset: 'utf8',
    entryPoints: [input],
    external,
    format: 'esm',
    jsx: 'preserve',
    outfile: output,
    sourcemap: true,
    sourcesContent: false,
    target: ['es2022'],
    treeShaking: true
  })
  checkEsbuildResult(result1)

  const code2 = fs.readFileSync(output, { encoding: 'utf8' })
  const result2 = await babel.transformAsync(code2, {
    shouldPrintComment: s => s.startsWith('!'),
    compact: false,
    filename: output,
    parserOpts: { plugins: ['jsx'] },
    sourceMaps: true
  })
  const sourceMappingURL = '\n//# sourceMappingURL=index.jsx.map'
  fs.writeFileSync(output, result2.code + sourceMappingURL)
  fs.writeFileSync(output + '.map', JSON.stringify(result2.map))
}

const buildIndexMinJsx = async dir => {
  const input = path.join(dir, 'dist/index.jsx')
  const output = path.join(dir, 'dist/index.min.jsx')

  console.log(`creating ${output}`)
  const result1 = await esbuild.build({
    bundle: true,
    charset: 'utf8',
    entryPoints: [input],
    external,
    format: 'esm',
    jsx: 'preserve',
    minify: true,
    mangleProps: /^_/,
    outfile: output,
    sourcemap: true,
    sourcesContent: false,
    target: ['es2022']
  })
  checkEsbuildResult(result1)

  const code2 = fs.readFileSync(output, { encoding: 'utf8' })
  const result2 = await babel.transformAsync(code2, {
    shouldPrintComment: s => s.startsWith('!'),
    compact: true,
    filename: output,
    parserOpts: { plugins: ['jsx'] },
    sourceMaps: true,
    plugins: [jsxTextCompactPlugin]
  })
  const sourceMappingURL = '\n//# sourceMappingURL=index.min.jsx.map'
  fs.writeFileSync(output, result2.code + sourceMappingURL)
  fs.writeFileSync(output + '.map', JSON.stringify(result2.map))
}

const buildIndexCss = async dir => {
  const input = 'styles/index.css'
  const output = path.join(dir, 'dist/index.css')

  console.log(`creating ${output}`)
  const result = await esbuild.build({
    banner: { css: banner(dir) },
    charset: 'utf8',
    entryPoints: [input],
    outfile: output,
    sourcemap: true
  })
  checkEsbuildResult(result)
}

const buildIndexMinCss = async dir => {
  const input = path.join(dir, 'dist/index.css')
  const output = path.join(dir, 'dist/index.min.css')

  console.log(`creating ${output}`)
  const result = await esbuild.build({
    charset: 'utf8',
    entryPoints: [input],
    outfile: output,
    sourcemap: true,
    minify: true
  })
  checkEsbuildResult(result)
}

const buildIndexMinDts = dir => {
  const input = path.join(dir, 'dist/index.d.ts')
  const outputs = [
    path.join(dir, 'dist/index.min.d.ts'),
    path.join(dir, 'dist/index.d.tsx'),
    path.join(dir, 'dist/index.min.d.tsx')
  ]

  for (const output of outputs) {
    console.log(`creating ${output}`)
    fs.copyFileSync(input, output)
  }
}

const esmOutput = dir => ({
  banner: banner(dir),
  format: 'es',
  sourcemap: true,
  sourcemapExcludeSources: true
})

const terserConfig = {
  ecma: 2022,
  compress: {
    join_vars: false,
    sequences: false,
    lhs_constants: false,
    reduce_funcs: false
  },
  mangle: false,
  output: {
    comments: /^!/,
    beautify: true,
    indent_level: 2,
    semicolons: false,
    preserve_annotations: true
  }
}

const rollupConfigDts = dir => ({
  input: path.join(dir, 'src/index.tsx'),
  output: [{ dir: path.join(dir, 'dist'), entryFileNames: '[name].d.ts' }],
  external: rollupExternal,
  plugins: [
    dtsPlugin(dir),
    closeBundlePlugin(
      [buildIndexMinDts, dir],
      [buildIndexCss, dir],
      [buildIndexMinCss, dir]
    )
  ]
})

export default [
  {
    input: './preact/src/index.tsx',
    output: [{ ...esmOutput('preact'), dir: 'preact/dist' }],
    external: rollupExternal,
    plugins: [
      cleanupPlugin('preact/dist'),
      resolvePlugin({ browser: true }),
      esbuildPlugin({
        jsx: 'automatic',
        jsxImportSource: 'preact',
        target: 'es2022'
      }),
      terserPlugin(terserConfig),
      closeBundlePlugin(
        [buildIndexMinJs, 'preact'],
        [buildIndexJsx, 'preact'],
        [buildIndexMinJsx, 'preact']
      )
    ]
  },
  rollupConfigDts('preact'),
  {
    input: './solid/src/index.tsx',
    output: [{ ...esmOutput('solid'), dir: 'solid/dist' }],
    external,
    plugins: [
      cleanupPlugin('solid/dist'),
      resolvePlugin(),
      esbuildPlugin({ jsx: 'preserve', target: 'es2022' }),
      babelPlugin({
        babelHelpers: 'bundled',
        extensions: ['.tsx'],
        presets: ['babel-preset-solid']
      }),
      terserPlugin(terserConfig),
      closeBundlePlugin(
        [buildIndexMinJs, 'solid'],
        [buildIndexJsx, 'solid'],
        [buildIndexMinJsx, 'solid']
      )
    ]
  },
  rollupConfigDts('solid')
]

import * as fs from 'node:fs'
import * as url from 'node:url'
import * as path from 'node:path'
import semanticRelease from 'semantic-release'
import * as commitAnalyzer from '@semantic-release/commit-analyzer'
import * as notesGenerator from '@semantic-release/release-notes-generator'
import * as npm from '@semantic-release/npm'
import * as git from '@semantic-release/git'
import * as github from '@semantic-release/github'
import { monorepo } from './monorepo.js'

const rootDir = url.fileURLToPath(new URL('..', import.meta.url))
process.chdir(rootDir)

const readPackageJson = dir =>
  JSON.parse(fs.readFileSync(path.join(rootDir, dir, 'package.json')))

for (const dir of ['preact', 'solid']) {
  const json = readPackageJson(dir)
  const pkg = { dir, includes: ['lib/**/*'] }
  const options = {
    branches: [
      { name: 'latest' },
      { name: 'next', channel: 'next', prerelease: true }
    ],
    tagFormat: dir + '-v<%= version %>',
    plugins: [
      monorepo(commitAnalyzer, pkg, 'commit-analyzer'),
      monorepo(
        notesGenerator,
        { ...pkg, versionName: json.name },
        'release-notes-generator'
      ),
      monorepo(npm, pkg, 'npm'),
      [
        monorepo(git, { ...pkg, cwd: rootDir }, 'git'),
        {
          assets: [`${pkg.dir}/package.json`],
          message: `chore(release): ${json.name} <%=
                    nextRelease.version %> [skip ci]\n\n<%=
                    nextRelease.notes %>`
        }
      ],
      [monorepo(github, pkg, 'github'), { successComment: false }]
    ]
  }
  await semanticRelease(options, { ...pkg, cwd: rootDir })
}

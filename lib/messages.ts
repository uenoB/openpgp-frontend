import * as openpgp from 'openpgp'
import * as en from './messages.en'
import * as ja from './messages.ja'

export const messages = { en, ja }[navigator.language] ?? en

export const openpgpNameVersion = openpgp.config.versionString
export const openpgpHomepage = new URL(openpgp.config.commentString).href
export const openpgpGithub = 'https://github.com/openpgpjs/openpgpjs'

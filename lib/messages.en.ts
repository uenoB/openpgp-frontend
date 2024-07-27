import type { Features } from './key'

export const _aboutMenu: string = 'About'
export const _availableButNotReady: string = 'Available, but not ready.'
export const _availableDragAndDropAFileOnThisPage: string =
  'Available. Drag-and-drop a file on this page.'
export const _availableDragAndDropAKeyFileOnThisPage: string =
  'Available. Drag-and-drop a key file on this page.'
export const _availableDragAndDropAnEncryptedFileOnThisPage: string =
  'Available. Drag-and-drop an encrypted file on this page.'
export const _badSignatureBy = (user: string, error: string): string =>
  `bad signature by ${user}: ${error}`
export const _certification: string = 'Certification'
export const _changePassword: string = 'Change password'
export const _commands: string = 'Commands'
export const _createANewPublicPrivateKeyPair: string =
  'Create a New Public/Private Key Pair'
export const _decryptedBy = (key: string): string => `Decrypted by ${key}`
export const _decryption: string = 'Decryption'
export const _deleteThisItem: string = 'Delete this item'
export const _email: string = 'Email'
export const _encryptedFor = (users: readonly string[]): string =>
  `Encrypted for:${users.map(i => '\n' + i).join('')}`
export const _fingerprint: string = 'Fingerprint'
export const _generateANewKey: string = 'Generate a New Key'
export const _goodSignatureBy = (user: string): string =>
  `good signature by ${user}`
export const _greetings1 = <X>(version: X): Array<string | X> => [
  'This is a simple frontend of',
  version
]
export const _greetings2 = <X>(license: X): Array<string | X> => [
  'OpenPGP.js is licensed under LGPL. See ',
  license,
  ' for details.'
]
export const _greetings2link = <X>(license: X): Array<string | X> => [
  'OpenPGP.js is licensed under LGPL. See ',
  license,
  ' for details.'
]
export const _greetings3: string[] = [
  'You can encrypt and decrypt files simply by dragging-and-dropping them on',
  ' this page. The resulting files will be listed here.'
]
export const _greetings4: string[] = [
  'Encryption and decryption is performed entirely in your web browser. Once',
  ' the script is fully loaded, the software does not communicate with any',
  ' server.'
]
export const _issueARevocationCertificate: string =
  'Issue a revocation certificate'
export const _keyHasBadSignatureOf = (key: string, signer: string): string =>
  `${key} has bad signature of ${signer}`
export const _keyIsNotSignedByAnyGivenKey = (key: string): string =>
  `${key} is not signed by any given key`
export const _keyIsSignedBy = (key: string, signer: string): string =>
  `${key} is signed by ${signer}`
export const _keyringMenu: string = 'Keyring'
export const _kindCertificated: string = 'Certificated'
export const _kindDecrypted: string = 'Decrypted'
export const _kindEncrypted: string = 'Encrypted'
export const _kindVerified: string = 'Verified'
export const _kindPrivateKey: string = 'Private key'
export const _kindPublicKey: string = 'Public key'
export const _kindRevokeCert: string = 'Revocation Certificate'
export const _kindSigned: string = 'Signed'
export const _mergeRevocationCertificateOf = (key: string): string =>
  `merge revocation certificate of ${key}`
export const _newKeyMenu: string = 'New Key'
export const _newPassword: string = 'New Password'
export const _notAvailable: string = 'Not available.'
export const _openPgpNewKeyPair: string = 'OpenPGP: New Key Pair'
export const _openPgpPrivateKey = (keyID: string): string =>
  `OpenPGP: Private Key ${keyID}`
export const _openPgpPublicKeyEncryptionFrontend: string =
  'OpenPGP Public Key Encryption Frontend'
export const _openPgpPublicKeys = (n: number): string =>
  `OpenPGP: ${n} Public Key${n > 1 ? 's' : ''}`
export const _openPrivateKey: string = 'Open Private Key'
export const _owner: string = 'Owner'
export const _ownerName: string = 'Owner Name'
export const _password: string = 'Password'
export const _passwordOfThisKey: string = 'Password of this key'
export const _privateKeyExplanation1 = <X>(publicKey: X): Array<string | X> => [
  'Bookmark this page to save this private key. Do NOT share this page with',
  ' others. Share ',
  publicKey,
  ' with others.'
]
export const _privateKeyExplanation2: string[] = [
  'Enter the password of this key to use this private key.'
]
export const _privateKeyFileContaining = (key: string): string =>
  `Private key file containing:\n${key}`
export const _privateKeyTitle: string = 'Private Key'
export const _publicKey: string = 'public key'
export const _publicKeyFeatureExplanation = (feat: Features): string => {
  if (!feat.valid) return 'invalid key'
  const msg: string[] = []
  if (feat.encryption) msg.push('encryption')
  if (feat.signing) msg.push('signing')
  return msg.length > 0 ? `for ${msg.join(' and ')}` : 'no feature available'
}
export const _publicKeysExplanation1: string[] = [
  'Bookmark this page to save these public keys. Share the bookmark to share',
  ' the public keys with others.'
]
export const _publicKeysExplanation2 = (feat: Features): string => {
  let msgs: string[] = []
  if (feat.valid && feat.encryption) msgs.push('encrypt them')
  if (feat.valid && feat.signing) msgs.push('verify their signatures')
  if (msgs.length >= 2) msgs = [`${msgs.join(', ')},`]
  msgs.push('add keys')
  const usage = msgs.join(' or ')
  return `Drag-and-drop or select files to ${usage}.`
}
export const _publicKeyFileContaining = (keys: readonly string[]): string =>
  `Public key file containing:${keys.map(i => '\n' + i).join('')}`
export const _publicKeysSignedByKey = (
  signer: string,
  keys: readonly string[]
): string =>
  `Public keys signed by ${signer}:${keys.map(i => '\n' + i).join('')}`
export const _publicKeysTitle = (n: number): string =>
  `Public Key${n > 1 ? 's' : ''}`
export const _revocationCertificateOf = (key: string): string =>
  `Revocation certificate of ${key}`
export const _savePrivateKeyInFile: string = 'Save private key in file'
export const _savePublicKeyInFile: string = 'Save public key in file'
export const _selectAll: string = 'Select all'
export const _signedBy = (key: string): string => `Signed by ${key}`
export const _signing: string = 'Signing'
export const _signUserByKey = (user: string, key: string): string =>
  `sign ${user} by ${key}`
export const _theSourceCodeOfOpenpgpJs: string = 'the source code of OpenPGP.js'
export const _verifiedContentOf = (filename: string): string =>
  `verified content of ${filename}`

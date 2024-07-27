import type { Features } from './key'

export const _aboutMenu: string = '説明'
export const _availableButNotReady: string =
  '使えますが、準備ができていません。'
export const _availableDragAndDropAFileOnThisPage: string =
  '使えます。署名するファイルをこのページにドラッグ&ドロップしてください。'
export const _availableDragAndDropAKeyFileOnThisPage: string =
  '使えます。鍵ファイルをこのページにドラッグ&ドロップしてください。'
export const _availableDragAndDropAnEncryptedFileOnThisPage: string =
  '使えます。暗号化されたファイルをこのページにドラッグ&ドロップしてください。'
export const _badSignatureBy = (user: string, error: string): string =>
  `${user}の不正な署名: ${error}`
export const _certification: string = '鍵署名'
export const _changePassword: string = 'パスワードを変更'
export const _commands: string = '操作'
export const _createANewPublicPrivateKeyPair: string =
  '公開鍵・秘密鍵の新規作成'
export const _decryptedBy = (key: string): string => `${key}による復号`
export const _decryption: string = '復号'
export const _deleteThisItem: string = 'この項目を削除'
export const _email: string = 'メールアドレス'
export const _encryptedFor = (users: readonly string[]): string =>
  `以下への暗号:${users.map(i => '\n' + i).join('')}`
export const _fingerprint: string = '鍵番号'
export const _generateANewKey: string = '新しい鍵を生成する'
export const _goodSignatureBy = (user: string): string => `${user}の正当な署名`
export const _greetings1 = <X>(version: X): Array<string | X> => [
  version,
  'のシンプルなフロントエンドです。'
]
export const _greetings2 = <X>(license: X): Array<string | X> => [
  'OpenPGP.jsはLGPLでライセンスされています。詳しくは',
  license,
  'をご覧ください。'
]
export const _greetings3: string[] = [
  'このページにファイルをドラッグ&ドロップするだけでファイルを',
  '暗号化・復号できます。結果のファイルはここに現れます。'
]
export const _greetings4: string[] = [
  '暗号化と復号はWebブラウザの中だけで行われます。',
  'スクリプトがすべてロードされた後は、このソフトウェアはサーバとは',
  '一切通信しません。'
]
export const _issueARevocationCertificate: string = '失効証明書を発行'
export const _keyHasBadSignatureOf = (key: string, signer: string): string =>
  `${key}には${signer}の不正な署名が付いています`
export const _keyIsNotSignedByAnyGivenKey = (key: string): string =>
  `${key}には既知の鍵の署名が付いていません`
export const _keyIsSignedBy = (key: string, signer: string): string =>
  `${key}には${signer}の署名が付いています`
export const _keyringMenu: string = '公開鍵一覧'
export const _kindCertificated: string = '鍵署名'
export const _kindDecrypted: string = '復号'
export const _kindEncrypted: string = '暗号'
export const _kindPrivateKey: string = '秘密鍵'
export const _kindPublicKey: string = '公開鍵'
export const _kindRevokeCert: string = '失効証明書'
export const _kindVerified: string = '検証'
export const _kindSigned: string = '署名'
export const _mergeRevocationCertificateOf = (key: string): string =>
  `${key}の失効証明書を取り込みます`
export const _newKeyMenu: string = '新しい鍵'
export const _newPassword: string = '新しいパスワード'
export const _notAvailable: string = '使えません。'
export const _openPgpNewKeyPair: string = 'OpenPGP: 新しい鍵ペアの作成'
export const _openPgpPrivateKey = (keyID: string): string =>
  `OpenPGP: 秘密鍵 ${keyID}`
export const _openPgpPublicKeyEncryptionFrontend: string =
  'OpenPGP公開鍵暗号フロントエンド'
export const _openPgpPublicKeys = (n: number): string =>
  `OpenPGP: ${n}個の公開鍵`
export const _openPrivateKey: string = '秘密鍵を開く'
export const _owner: string = '所有者'
export const _ownerName: string = '所有者の名前'
export const _password: string = 'パスワード'
export const _passwordOfThisKey: string = 'この鍵のパスワード'
export const _privateKeyExplanation1 = <X>(publicKey: X): Array<string | X> => [
  '秘密鍵を保存するにはこのページをブックマークしてください。',
  'このページを他人に見せないでください。他人とは',
  publicKey,
  'を共有してください。'
]
export const _privateKeyExplanation2: string[] = [
  'この秘密鍵を使うにはパスワードを入力してください。'
]
export const _privateKeyFileContaining = (key: string): string =>
  `以下を含む秘密鍵ファイル:\n${key}`
export const _privateKeyTitle: string = '秘密鍵'
export const _publicKey: string = '公開鍵'
export const _publicKeyFeatureExplanation = (feat: Features): string => {
  if (!feat.valid) return '失効されています'
  const msg: string[] = []
  if (feat.encryption) msg.push('暗号化')
  if (feat.signing) msg.push('署名')
  return msg.length > 0 ? `${msg.join('・')}に使えます` : '無効な鍵です'
}
export const _publicKeysExplanation1: string[] = [
  '公開鍵を保存するにはこのページをブックマークしてください。',
  'ブックマークを共有すると公開鍵を他人と共有できます。'
]
export const _publicKeysExplanation2 = (feat: Features): string => {
  const msgs: string[] = []
  if (feat.valid && feat.encryption) msgs.push('暗号化')
  if (feat.valid && feat.signing) msgs.push('署名検証')
  msgs.push('鍵の追加')
  const usage = msgs.join('・')
  return `ファイルをドラッグ&ドロップすると${usage}ができます。`
}
export const _publicKeyFileContaining = (keys: readonly string[]): string =>
  `以下を含む公開鍵ファイル:${keys.map(i => '\n' + i).join('')}`
export const _publicKeysSignedByKey = (
  signer: string,
  keys: readonly string[]
): string => `${signer}が署名した公開鍵:${keys.map(i => '\n' + i).join('')}`
export const _publicKeysTitle = (_: number): string => `公開鍵一覧`
export const _revocationCertificateOf = (key: string): string =>
  `${key}の失効証明書`
export const _savePrivateKeyInFile: string = '秘密鍵をファイルに保存'
export const _savePublicKeyInFile: string = '公開鍵をファイルに保存'
export const _selectAll: string = '全て選択'
export const _signedBy = (key: string): string => `${key}による署名`
export const _signing: string = '署名'
export const _signUserByKey = (user: string, key: string): string =>
  `${key}で${user}に署名します`
export const _theSourceCodeOfOpenpgpJs: string = 'OpenPGP.jsのソースコード'
export const _verifiedContentOf = (filename: string): string =>
  `署名検証した${filename}の内容`

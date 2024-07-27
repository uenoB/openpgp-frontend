import type { SingleKey } from '../../lib/key'

export const UserID: preact.FunctionComponent<{
  pgpKey: SingleKey
  children?: never
}> = ({ pgpKey: key }) => (
  <>
    {key.userName}
    {key.email != null && (
      <>
        {' '}
        <a className="openpgp-userid-email" href={`mailto:${key.email}`}>
          {key.email}
        </a>
      </>
    )}
  </>
)

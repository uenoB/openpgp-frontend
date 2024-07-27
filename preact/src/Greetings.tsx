import * as m from '../../lib/messages'

export const Greetings: preact.FunctionComponent<{ children?: never }> = () => (
  <>
    <p>
      {m.messages._greetings1(
        <a href={m.openpgpHomepage}>{m.openpgpNameVersion}</a>
      )}
    </p>
    <p>
      {m.messages._greetings2(
        <a href={m.openpgpGithub}>{m.messages._theSourceCodeOfOpenpgpJs}</a>
      )}
    </p>
    <p>{m.messages._greetings3}</p>
    <p>{m.messages._greetings4}</p>
  </>
)

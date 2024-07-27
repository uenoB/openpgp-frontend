const urlMap = new Map<string, string>()

for (const elem of document.querySelectorAll('script[type=inline_module]')) {
  const script = document.createElement('script')
  const source =
    elem.textContent?.replace(
      /(\bimport\b[^'";]*['"])([^'"]+)(['"])/g,
      (_, pre: string, id: string, post: string) =>
        `${pre}${urlMap.get(id) ?? id}${post}`
    ) ?? ''
  const blob = new Blob([source], { type: 'application/javascript' })
  script.src = URL.createObjectURL(blob)
  script.type = 'module'
  urlMap.set(elem.id, script.src)
  elem.replaceWith(script)
}

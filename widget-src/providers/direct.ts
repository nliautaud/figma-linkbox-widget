import { fetchUrl } from "../Fetch"
import { LinkType, FetchResult, FetchResponse, Provider } from "../types"
import Jsonlink from "./jsonlink"

const URL = require('url')
import { HTMLElement, parse as parseHtml } from 'node-html-parser'

export default {
  name: 'direct',
  url: (u: string) => u,
  fetch: async (url: string): Promise<FetchResult> => {
    const response = await fetchUrl(url)
    const isHtml = response.hasTypes(["text/html", "application/xhtml+xml"])
    if (isHtml) {
      try {
        return await Jsonlink.fetch(url)
      } catch (err: any) { }
    }
    return await parseText(response)
  }
} satisfies Provider


export async function parseText(response: FetchResponse): Promise<FetchResult> {
  const content = await response.text()
  if (response.hasTypes(["text/plain", "application/json"])) {
    const truncate = content.length > 300
    return {
      type: LinkType.code,
      title: response.contentType.split(';')[0],
      description: truncate ? content.slice(0, 300) + "\n..." : content,
      code: true,
    }
  } else if (response.hasTypes(["text/xml", "application/atom+xml"])) {
    const root = parseHtml(content)
    const items = [
      ...root.getElementsByTagName('entry'),
      ...root.getElementsByTagName('item')
    ]
    return {
      type: LinkType.rss,
      title: root.getElementsByTagName('title')[0].textContent,
      description: items.length ?
        "- " +
        items.slice(0, 4)
          .map(e =>
            e.getElementsByTagName('title')[0].textContent
              .replace(/^\<\!\[CDATA\[(.*)\]\]\>$/, '$1')
          ).join("\n- ")
        : undefined
    }
  } else if (response.hasTypes(["image/"])) {
    return {
      type: LinkType.image,
      title: response.contentType.split(';')[0],
      image: response.url,
    }
  } else if (response.hasTypes(["text/html", "application/xhtml+xml"])) {
    const root = parseHtml(content)
    return {
      type: LinkType.html,
      icon: {
        url: parseIcon(root, response.url),
      },
      title: parseMeta(root, 'title'),
      image: parseMeta(root, 'image'),
      description: parseMeta(root, 'description')
    }
  }
  throw new Error('Invalid content type ' + response.contentType)
}

function parseMeta(root: HTMLElement, name: string) {
  const base = root.querySelector(name)?.textContent
  const metas = root.querySelectorAll(`meta[name=${name}], meta[property="og:${name}"], meta[name="twitter:${name}"]`).map(e => e.getAttribute('content'))
  const data = [base, ...metas].filter(Boolean) as string[]
  if (data.length == 0) return ''
  const id = data.reduce((p, c, i, a) => a[p] && a[p].length > c.length ? p : i, 0)
  return data[id]
}
function parseIcon(root: HTMLElement, url: any) {
  const format = (uri: string | undefined) => {
    if (!uri) return undefined
    const parsed = URL.parse(uri)
    if (!parsed.protocol) {
      return URL.resolve(url, uri)
    }
    return parsed.href
  }
  let sizedIcons = root.querySelectorAll('link[rel*="icon"][href$="png"][sizes*=x]')
  if (sizedIcons.length) {
    // return the largest one
    const getSize = (e: HTMLElement) => {
      const sizes = e.getAttribute('sizes')
      if (!sizes) return 0
      return Number(sizes.split('x')[0])
    }
    const sizedHrefs = sizedIcons.map(e => ({
      href: e.getAttribute('href'),
      size: getSize(e)
    })).sort((a, b) => b.size - a.size)
    return format(sizedHrefs[0].href)
  }
  // fallback return any icon
  const href = root.querySelector('link[rel*="icon"]:not([href$=ico])')?.getAttribute('href')
  return format(href)
}
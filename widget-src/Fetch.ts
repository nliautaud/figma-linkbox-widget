
const URL = require('url')
import { HTMLElement, parse as parseHtml, valid } from 'node-html-parser'

export enum LinkType {
  none,
  html,
  code,
  rss
}
export interface FetchResult {
  type: LinkType
  icon?: {
    url?: string
    // svg?: string
  }
  title?: string
  image?: string
  description?: string
  code?: boolean
}

const IFRAMELY_HASH = '25f733c545dd9edca0769c25e27988b4'
const framelyurl = (u:string, k: string) =>`https://iframe.ly/api/iframely?url=${u}&key=${k}`
const proxyurl = (u:string) =>`https://corsproxy.io/?${u}`

// fetch type : async (str:string) => await fetchUrl(str)
const proxy = async (url: string, proxy=false):Promise<FetchResult> => {

  const response = await fetchUrl(proxy ? proxyurl(url) : url)
  const content = await response.text()
  const contentType = response.headersObject['content-type']
  const hasContentType = (res:any, types:string[]) => types.some(t => contentType.indexOf(t) !== -1)

  if (hasContentType(response, ["text/plain", "application/json"])) {
    const truncate = content.length > 300
    return {
      type: LinkType.code,
      title: contentType.split(';')[0],
      description: truncate ? content.slice(0, 300)+"\n..." : content,
      code: true,
    }
  } else if (hasContentType(response, ["text/xml", "application/atom+xml"])) {
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
  } else if(hasContentType(response, ["text/html", "application/xhtml+xml"])) {
    const root = parseHtml(content)
    return {
      type: LinkType.html,
      icon: {
        url: parseIcon(root, url),
      },
      title: parseMeta(root, 'title'),
      image: parseMeta(root, 'image'),
      description: parseMeta(root, 'description')
    }
  }
  throw new Error('Invalid content type ' + contentType)
}

const framely = async (url: string):Promise<FetchResult> => {
  const furl = framelyurl(encodeURIComponent(url), IFRAMELY_HASH)
  const response = await fetchUrl(furl)
  const json = await response.json()
  // console.log('iframely', json)
  if (json.error) throw new Error(json.error)
  // cannot use an svg url in SVG nor Image,
  // and ico are not supported in Image
  const validIcons = json.links.icon.filter((e: any) => e.href.endsWith('.png'))
  return {
    type: LinkType.html,
    icon: {
      url: validIcons.length ? validIcons[0].href : undefined,
    },
    title: json.meta.title,
    image: json.links.thumbnail?.length ? json.links.thumbnail[0].href : undefined,
    description: json.meta.description
  }
}

const fetchUrl = async (url: string) => {
  const fetchWithTimeout: any = (url: string, options = {}, timeout: number) => Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
  ])
  console.log('fetch', url)
  const response = await fetchWithTimeout(url, {}, 99999)
  if (!response.ok) {
    throw new Error(`Error ${response.status} ${response.statusText}`)
  }
  return response
}

const formatUrl = (str: string, https = false):URL|undefined => {
  const url = URL.parse(str)
  // console.log(str, '=>', url.href, url)
  if (!url.href) return
  if (url.protocol && !url.protocol.startsWith('http')) {
    throw new Error('Invalid URL protocol')
  }
  if (!https && url.protocol == 'https:') {
    url.protocol = ''
  }
  if (url.host) url.host = url.hostname = url.host.replace('www.', '')
  else url.pathname = url.pathname.replace(/^www\./, '')
  const formattedURL =
    (https && !url.protocol ? 'https://' : '') +
    URL.format(url)
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
  const parsed = URL.parse(formattedURL)
  // console.log('=>', formattedURL, https, url, parsed)
  return parsed
}

const parseMeta = (root: HTMLElement, name: string) => {
  const base = root.querySelector(name)?.textContent
  const metas = root.querySelectorAll(`meta[name=${name}], meta[property="og:${name}"], meta[name="twitter:${name}"]`).map(e => e.getAttribute('content'))
  const data = [base, ...metas].filter(Boolean) as string[]
  if (data.length == 0) return ''
  const id = data.reduce((p, c, i, a) => a[p] && a[p].length > c.length ? p : i, 0)
  return data[id]
}
const parseIcon = (root: HTMLElement, url: any) => {
  const format = (uri: string|undefined) => {
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


export const Fetch = {
  proxy,
  framely,
}
export const Url = {
  withHttps: (str: string) => formatUrl(str, true),
  withoutHttps: (str: string) => formatUrl(str, false),
}
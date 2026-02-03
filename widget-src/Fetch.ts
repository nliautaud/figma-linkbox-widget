import { log } from './utils'

import { FetchResult, FetchResponse, Provider } from './types'
import Direct from './providers/direct'
import Jsonlink from './providers/jsonlink'

const URL = require('url')

async function url(url:string):Promise<FetchResult> {
  const stack:Provider[] = [Direct, Jsonlink]
  for (const provider of stack) {
    try {
      const resp = await provider.fetch(url)
      log('🌟 Fetched', provider.name, provider.url(url))
      return resp
    } catch (err: any) {
      log('➖ Cannot fetch', provider.name, `(${err.message})`, provider.url(url))
    }
  }
  throw new Error('❌ All providers failed to fetch')
}
export async function fetchUrl(url: string): Promise<FetchResponse> {
  // const fetchWithTimeout: FetchResponse = (url: string, options = {}, timeout: number) => Promise.race([
  //   fetch(url, options),
  //   new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
  // ])
  const encodedUrl = url// encodeURIComponent(url)
  const response = await fetch(encodedUrl, {})
  if (!response.ok) {
    throw new Error(`Error ${response.status} ${response.statusText}`)
  }
  return {
    ...response,
    url: encodedUrl,
    contentType: response.headersObject['content-type'],
    hasTypes: function(this: FetchResponse, types:string[]){
      return types.some(t => this.contentType.indexOf(t) !== -1)
    },
    json: response.json,
    text: response.text
  } as FetchResponse
}

const formatUrl = (str: string, https = false):URL|undefined => {
  const url = URL.parse(str)
  // log(str, '=>', url.href, url)
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
  // log('=>', formattedURL, https, url, parsed)
  return parsed
}


export const Fetch = {
  url,
}
export const Url = {
  withHttps: (str: string) => formatUrl(str, true),
  withoutHttps: (str: string) => formatUrl(str, false),
}

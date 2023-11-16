export enum LinkType {
  none = 'none',
  html = 'html',
  code = 'code',
  rss = 'rss',
  image = 'image',
}
export interface FetchResponse extends globalThis.FetchResponse {
  contentType: string
  hasTypes: (types:string[]) => boolean
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
export interface Provider {
  name: string
  url: (u: string) => string
  fetch: (url: string) => Promise<FetchResult>
}
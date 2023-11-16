import { fetchUrl } from "../Fetch"
import { FetchResult, LinkType, Provider } from "../types"

const HASH = '25f733c545dd9edca0769c25e27988b4'
const formatUrl = (u:string) =>
    `https://iframe.ly/api/iframely?url=${u}&key=${HASH}`

export default {
  name: 'Framely',
  url: formatUrl,
  fetch: async (url:string):Promise<FetchResult> => {
    const response = await fetchUrl(formatUrl(url))
    const json = await response.json()
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
} satisfies Provider
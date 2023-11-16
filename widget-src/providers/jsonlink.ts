import { fetchUrl } from "../Fetch"
import { FetchResult, LinkType, Provider } from "../types"

const KEY = 'pk_156b02c27f4c2de7d00f038263d5266d809a10e3'
const formatUrl = (u:string) => `https://jsonlink.io/api/extract?url=${u}&api_key=${KEY}`

export default {
  name: 'Jsonlink',
  url: formatUrl,
  fetch: async (url: string):Promise<FetchResult> => {
    const response = await fetchUrl(formatUrl(url))
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    const json = await response.json()
    if (json.error) throw new Error(json.error)
    return {
      type: LinkType.html,
      icon: {
        url: json.favicon,
      },
      title: json.title,
      image: json.images.length ? json.images[0] : undefined,
      description: json.description
    }
  }
} satisfies Provider
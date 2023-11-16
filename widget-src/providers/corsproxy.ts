import { fetchUrl } from "../Fetch"
import { FetchResult, Provider } from "../types"
import { parseText } from "./direct"

const proxyurl = (u: string) => `https://corsproxy.io/?${u}`
export default {
  name: 'corsproxy',
  url: proxyurl,
  fetch: async (url: string): Promise<FetchResult> => {
    const response = await fetchUrl(proxyurl(url))
    return await parseText(response)
  }
} satisfies Provider
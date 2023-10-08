// This is a counter widget with buttons to increment and decrement the number.

const { widget } = figma
const { useSyncedState, usePropertyMenu, Frame, AutoLayout, Text, SVG, Input, Image } = widget

const URL = require('url')
import { HTMLElement, parse, valid } from 'node-html-parser'

const CORSPROXY = 'https://corsproxy.io/?'
const framely = (url: string, hash: string) => `https://iframe.ly/api/iframely?url=${encodeURIComponent(url)}&key=${hash}`
const IFRAMELY_HASH = '25f733c545dd9edca0769c25e27988b4'

const defaultAccent: string = "#eee"

function Widget() {
  const [fetchState, setFetchState] = useSyncedState<boolean | null>('fetchState', false)
  const [error, setError] = useSyncedState('error', '')

  const [href, setHref] = useSyncedState('href', '')
  const [title, setTitle] = useSyncedState('title', '')
  const [userTitle, setUserTitle] = useSyncedState('userTitle', '')
  const [icon, setIcon] = useSyncedState('icon', '')
  const [desc, setDesc] = useSyncedState('desc', '')
  const [image, setImage] = useSyncedState('image', '')

  const [showUrl, setShowUrl] = useSyncedState('showUrl', true)
  const [showDesc, setShowDesk] = useSyncedState('showDesk', true)
  const [showImage, setShowImage] = useSyncedState('showImage', true)

  const [theme, setTheme] = useSyncedState("theme", "light")
  const [accent, setAccent] = useSyncedState("accent", defaultAccent)
  const [size, setSize] = useSyncedState('size', 16)
  const [vertical, setVertical] = useSyncedState('vertical', false)

  const [useIframely, setUseIframely] = useSyncedState('useIframely', false)

  const s = (target: number) => target * (size / 16)

  const reload = () => {
    setTitle('')
    setIcon('')
    setDesc('')
    setImage('')
    updateUrl(href, true)
  }

  const parseUrl: any = (str: string, https = false) => {
    try {
      const url = URL.parse(str)
      // console.log(str, '=>', url.href, url)
      if (!url.href) return false
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
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const fetchUrl = async (url: string, json = false) => {
    const fetchWithTimeout: any = (url: string, options = {}, timeout: number) => Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
    console.log('fetch', url)
    const response = await fetchWithTimeout(url, {}, 99999)
    if (!response.ok) {
      throw new Error(`Error ${response.status} ${response.statusText}`)
    }
    const out = json ? await response.json() : await response.text();
    return out
  }
  
  const navigate = (url: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      figma.showUI(
        `<script>window.open('${url}', '_blank')</script>`,
        { visible: false }
      )
      setTimeout(resolve, 1000)
    })
  }

  const updateUrl = async (str: string, reset = false) => {
    const parseMeta = (root: HTMLElement, name: string) => {
      const base = root.querySelector(name)?.textContent
      const metas = root.querySelectorAll(`meta[name=${name}], meta[property="og:${name}"], meta[name="twitter:${name}"]`).map(e => e.getAttribute('content'))
      const data = [base, ...metas].filter(Boolean) as string[]
      console.log(name, data)
      if (data.length == 0) return ''
      const id = data.reduce((p, c, i, a) => a[p] && a[p].length > c.length ? p : i, 0)
      return data[id]
    }
    const parseIcon = (root: HTMLElement, url: any) => {
      const format = (uri: string | undefined) => {
        if (!href) return false
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
        const id = sizedIcons.reduce((p, c, i, a) => a[p] && getSize(a[p]) > getSize(c) ? p : i, 0)
        return format(sizedIcons[id].getAttribute('href'))
      }
      // fallback return any icon
      const href = root.querySelector('link[rel*="icon"]:not([href$=ico])')?.getAttribute('href')
      return format(href)
    }

    setFetchState(false)
    let url = parseUrl(str, true)
    if (!url) {
      setHref('')
      setError('')
      return
    }
    if (!reset && href == url.href)
      return setFetchState(true)

    setHref(parseUrl(str, false).href)
    setFetchState(null) // loading...
    setError('')
    setIcon('')
    setTitle('')
    setUserTitle('')
    setImage('')
    setDesc('')

    if (!useIframely) {
      try {
        const html = await fetchUrl(CORSPROXY + url.href)
        setFetchState(true)
        const root = parse(html)
        setIcon(parseIcon(root, url) || '')
        setTitle(parseMeta(root, 'title'))
        setImage(parseMeta(root, 'image'))
        setDesc(parseMeta(root, 'description'))
        return
      } catch (err: any) {
        setError(err.message)
        setFetchState(false)
      }
    }
    setError('')
    if (useIframely || error != null) {
      try {
        const json = await fetchUrl(framely(url.href, IFRAMELY_HASH), true)
        if (json.error) throw new Error(json.error)
        setFetchState(true)
        console.log('iframely', json)
        // cannot use an svg url in SVG nor Image,
        // and ico are not supported in Image
        const validIcons = json.links.icon.filter((e: any) => e.href.endsWith('.png'))
        setIcon(validIcons.length ? validIcons[0].href : '')
        setTitle(json.meta.title || '')
        setImage(json.links.thumbnail?.length ? json.links.thumbnail[0].href : '')
        setDesc(json.meta.description || '')
      } catch (err: any) {
        setError(err.message.replace('Iframely', 'Error :'))
        setFetchState(false)
      }
    }
    // try {
    //   const json = await fetchUrl(JSONLINK+encodeURIComponent(url.href), true)
    //   setFetchState(true)
    //   console.log('json', json)
    //   setIcon('')
    //   setTitle(json.title)
    //   setImage(json.images[0])
    //   setDesc(json.description)
    //   setError('')
    //   return
    // } catch (err:any) {
    //   setError(err.message)
    //   console.log(err)
    // setFetchState(false)
    // }
  }

  usePropertyMenu(
    [
      {
        itemType: 'toggle',
        propertyName: 'vertical',
        isToggled: !vertical,
        tooltip: 'Horizontal layout',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M22 12H2M22 12L19 9M22 12L19 15M2 12L5 9M2 12L5 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
      },
      {
        itemType: 'dropdown',
        propertyName: 'theme',
        tooltip: 'Theme',
        selectedOption: theme,
        options: [
          { label: "Light", option: "light" },
          { label: "Dark", option: "dark" },
        ],
      },
      {
        itemType: 'color-selector',
        propertyName: 'accent',
        tooltip: 'Accent color',
        selectedOption: accent,
        options: [
          { tooltip: "Default", option: defaultAccent },
          { tooltip: "Red", option: "#F24822" },
          { tooltip: "Orange", option: "#FFA629" },
          { tooltip: "Yellow", option: "#FFCD29" },
          { tooltip: "Green", option: "#14AE5C" },
          { tooltip: "Blue", option: "#0D99FF" },
          { tooltip: "Violet", option: "#9747FF" },
          { tooltip: 'Hot Pink', option: '#f5427b' }
        ],
      }, {
        itemType: 'dropdown',
        tooltip: 'Font size',
        propertyName: 'size',
        options: [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40].map((o) => (
          { option: o.toString(), label: o.toString() }
        )),
        selectedOption: size.toString()
      },
      {
        itemType: 'toggle',
        propertyName: 'showUrl',
        isToggled: showUrl,
        tooltip: 'Show URL',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="1.5"><path d="M10.046 14c-1.506-1.512-1.37-4.1.303-5.779l4.848-4.866c1.673-1.68 4.25-1.816 5.757-.305c1.506 1.512 1.37 4.1-.303 5.78l-2.424 2.433"/><path d="M13.954 10c1.506 1.512 1.37 4.1-.303 5.779l-2.424 2.433l-2.424 2.433c-1.673 1.68-4.25 1.816-5.757.305c-1.506-1.512-1.37-4.1.303-5.78l2.424-2.433"/></g></svg>        `,
      }, {
        itemType: 'toggle',
        propertyName: 'description',
        isToggled: showDesc,
        tooltip: 'Show description',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-width="1.5"><path d="M3 10c0-3.771 0-5.657 1.172-6.828C5.343 2 7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172C21 4.343 21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828C18.657 22 16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172C3 19.657 3 17.771 3 14v-4Z"/><path stroke-linecap="round" d="M8 12h8M8 8h8m-8 8h5"/></g></svg>`,
      }, {
        itemType: 'toggle',
        propertyName: 'showImage',
        isToggled: showImage,
        tooltip: 'Show image',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-width="1.5"><path d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2c4.714 0 7.071 0 8.535 1.464C22 4.93 22 7.286 22 12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z"/><circle cx="16" cy="8" r="2"/><path stroke-linecap="round" d="m5 13.307l.81-.753a2.3 2.3 0 0 1 3.24.108l2.647 2.81c.539.572 1.42.649 2.049.18a2.317 2.317 0 0 1 2.986.181L19 18"/></g></svg>`,
      },
      // {
      //   itemType: 'separator'
      // },
      // {
      //   itemType: 'toggle',
      //   propertyName: 'iframely',
      //   isToggled: useIframely,
      //   tooltip: 'Force API',
      //   icon: `<svg width="96" height="96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m22.764 54.08 20.494-16.585V25.48L16.666 49.003l6.098 5.078Zm3.895 3.216 16.599 13.878V59.158l-9.655-7.785-6.944 5.923ZM69.34 39.865 52.742 25.479v12.185l9.824 7.785 6.774-5.584Zm3.727 3.046L52.912 59.327v11.847l26.421-22.848-6.266-5.415Z" fill="#fff"/></svg>
      //   `,
      // },
      // {
      //   itemType: 'action',
      //   propertyName: 'reload',
      //   tooltip: 'Reload',
      //   icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#fff" d="M19.295 12a.704.704 0 0 1 .705.709v3.204a.704.704 0 0 1-.7.709a.704.704 0 0 1-.7-.709v-1.125C16.779 17.844 13.399 20 9.757 20c-4.41 0-8.106-2.721-9.709-6.915a.712.712 0 0 1 .4-.917c.36-.141.766.04.906.405c1.4 3.662 4.588 6.01 8.403 6.01c3.371 0 6.52-2.182 7.987-5.154l-1.471.01a.704.704 0 0 1-.705-.704a.705.705 0 0 1 .695-.714L19.295 12Zm-9.05-12c4.408 0 8.105 2.721 9.708 6.915a.712.712 0 0 1-.4.917a.697.697 0 0 1-.906-.405c-1.4-3.662-4.588-6.01-8.403-6.01c-3.371 0-6.52 2.182-7.987 5.154l1.471-.01a.704.704 0 0 1 .705.704a.705.705 0 0 1-.695.714L.705 8A.704.704 0 0 1 0 7.291V4.087c0-.392.313-.709.7-.709c.386 0 .7.317.7.709v1.125C3.221 2.156 6.601 0 10.243 0Z"/></svg>`,
      // }
    ],
    ({ propertyName, propertyValue }) => {
      if (propertyName === "accent" && propertyValue) {
        setAccent(propertyValue)
      } else if (propertyName === "theme" && propertyValue) {
        setTheme(propertyValue)
      } else if (propertyName === "description") {
        setShowDesk(!showDesc)
      } else if (propertyName === "showUrl") {
        setShowUrl(!showUrl)
      } else if (propertyName === "showImage") {
        setShowImage(!showImage)
      } else if (propertyName === "size") {
        setSize(Number(propertyValue))
      } else if (propertyName === "iframely") {
        setUseIframely(!useIframely)
        reload()
      } else if (propertyName === "reload") {
        reload()
      } else if (propertyName === "vertical") {
        setVertical(!vertical)
      }
    }
  )

  const ImageComponent = fetchState && showImage && image ? (
    <Image
      name='Image'
      src={image}
      width={vertical ? 'fill-parent' : s(160)}
      height={vertical ? s(160) : 'fill-parent'}
    />
  ) : null

  const corners = (radius: number) => ({
    topRight: ImageComponent ? 0 : s(radius),
    bottomRight: vertical ? s(radius) : 0,
    bottomLeft: s(radius),
    topLeft: vertical ? 0 : s(radius)
  })

  const colors = () => theme == 'light' ? {
    bg: "#fff",
    bgHover: "#f3f3f3",
    txt: "#000",
    txtFaded: "#555",
    stroke: { r: 0, g: 0, b: 0, a: .1 },
    border: "#eee",
    error: "#EF1818",
  } : {
    bg: "#333",
    bgHover: "#3a3a3a",
    txt: "#fff",
    txtFaded: "#bbb",
    stroke: { r: 1, g: 1, b: 1, a: .1 },
    border: "#282828",
    error: "#D62E2E",
  }

  return (
    <AutoLayout
      name='Wrapper'
      direction={vertical ? 'vertical' : 'horizontal'}
      width={s(600)}
      cornerRadius={s(10)}
      fill={colors().bg}
      // stroke={accent == defaultAccent ? '' : colors().stroke}
      strokeAlign='inside'
    >
      {vertical && ImageComponent}
      <AutoLayout
        name='Content'
        direction='vertical'
        width={'fill-parent'}
        fill={accent == defaultAccent ? colors().border : accent}
        // stroke={accent == defaultAccent ? colors().stroke : accent}
        stroke={colors().stroke}
        strokeWidth={1}
        padding={{
          bottom: s(accent == defaultAccent ? 6 : 8)
        }}
        cornerRadius={corners(10)}
      >
        <AutoLayout
          name='Inner'
          direction='vertical'
          horizontalAlignItems={'start'}
          verticalAlignItems='center'
          cornerRadius={corners(8)}
          fill={colors().bg}
          width={'fill-parent'}
          padding={{
            left: s(8),
            right: s(8),
            top: s(8),
            bottom: fetchState && (showUrl || showDesc) ? s(8) : s(4)
          }}
        >
          {fetchState && !error ?
            <>
              <AutoLayout
                name='Headline'
                width={'fill-parent'}
                verticalAlignItems={'center'}
                spacing={s(8)}
                padding={{
                  vertical: 0,
                  horizontal: s(8)
                }}
              >
                <Frame
                  name='Icon'
                  width={s(24)}
                  height={s(24)}
                  cornerRadius={s(8)}
                  onClick={() => navigate(parseUrl(href, true).href)}
                >
                  {icon ? <Image
                    name='icon'
                    src={icon}
                    width={s(24)}
                    height={s(24)}
                  /> : <Frame
                    width={s(24)}
                    height={s(24)}
                    cornerRadius={s(8)}
                    fill={accent == defaultAccent ? colors().border : accent}
                  ></Frame>}
                </Frame>
                <Input
                  name='Title-Input'
                  placeholder={title}
                  value={userTitle || title}
                  onTextEditEnd={(event) => setUserTitle(event.characters)}
                  width='fill-parent'
                  height='hug-contents'
                  fill={colors().txt}
                  href=''
                  fontSize={s(16)}
                  inputBehavior={'wrap'}
                  inputFrameProps={{
                    hoverStyle: {
                      fill: colors().bgHover
                    },
                    cornerRadius: s(8),
                    padding: s(8),
                    wrap: true
                  }}
                />
              </AutoLayout>
              {desc && showDesc ?
                <AutoLayout
                  name='Description'
                  width={'fill-parent'}
                  verticalAlignItems={'center'}
                  padding={s(8)}
                >
                  <Text
                    name='description'
                    fontWeight={300}
                    fontSize={s(14)}
                    width={'fill-parent'}
                    fill={colors().txt}
                  >{desc}</Text>
                </AutoLayout> : null}
            </> : null}
          {showUrl && <AutoLayout
            name='URL'
            width={'fill-parent'}
            verticalAlignItems={'center'}
            spacing={s(8)}
            padding={{
              vertical: 0,
              horizontal: s(4)
            }}
          >
            <Input
              name='url-input'
              fontWeight='normal'
              placeholder="https://"
              placeholderProps={{
                fill: colors().txt,
                fontSize: size,
                fontWeight: 400
              }}
              value={href}
              href=''
              onTextEditEnd={(event) => updateUrl(event.characters)}
              truncate={1}
              width='fill-parent'
              height='hug-contents'
              fill={colors().txtFaded}
              fontSize={size}
              inputBehavior={'truncate'}
              inputFrameProps={{
                hoverStyle: {
                  fill: colors().bgHover
                },
                cornerRadius: s(8),
                padding: s(4),
                overflow: 'scroll',
                wrap: false
              }}
            />
            {fetchState == null && <Text
              name='loading'
              fontSize={s(13)}
              fill={colors().txtFaded}
            >Loading...</Text>}
          </AutoLayout>}
          {error ? <AutoLayout
            name='Error'
            padding={{
              vertical: s(4),
              horizontal: s(8)
            }}>
            <Text
              name='error'
              fontSize={s(13)}
              width={'fill-parent'}
              fill={colors().error}
            >{error}</Text>
          </AutoLayout> : null}
        </AutoLayout>
      </AutoLayout>
      {!vertical && ImageComponent}
    </AutoLayout>
  )
}

widget.register(Widget)

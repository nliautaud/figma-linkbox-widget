const { widget } = figma
const { useSyncedState, usePropertyMenu, Frame, AutoLayout, Text, SVG, Input, Image } = widget

import { Fetch, Url, LinkType, FetchResult } from './Fetch'
import { Colors, Themes } from './Themes'
import { Icons } from './Icons'

const defaultAccent: string = "#eee"

function Widget() {
  const [fetchState, setFetchState] = useSyncedState<boolean | null>('fetchState', false)
  const [error, setError] = useSyncedState('error', '')

  const [type, setType] = useSyncedState<LinkType>('type', LinkType.none)
  const [href, setHref] = useSyncedState('href', '')
  const [title, setTitle] = useSyncedState('title', '')
  const [tag, setTag] = useSyncedState('tag', '')
  const [userTitle, setUserTitle] = useSyncedState('userTitle', '')
  const [icon, setIcon] = useSyncedState('icon', '')
  // const [svgIcon, setSvgIcon] = useSyncedState('icon', '')
  const [desc, setDesc] = useSyncedState('desc', '')
  const [isCode, setIsCode] = useSyncedState('isCode', false)
  const [image, setImage] = useSyncedState('image', '')

  const [showUrl, setShowUrl] = useSyncedState('showUrl', true)
  const [showDesc, setShowDesk] = useSyncedState('showDesk', true)
  const [showImage, setShowImage] = useSyncedState('showImage', true)

  const [theme, setTheme] = useSyncedState<Themes>("theme", Themes.Light)
  const [accent, setAccent] = useSyncedState("accent", defaultAccent)
  const [size, setSize] = useSyncedState('size', 16)
  const [vertical, setVertical] = useSyncedState('vertical', false)

  const [forceFramely, setUseIframely] = useSyncedState('useIframely', false)

  // size in px relative to 16
  const s = (target: number) => target * (size / 16)

  const reload = () => {
    setTitle('')
    setIcon('')
    setDesc('')
    setImage('')
    update(href)
  }

  const onChange = async (str: string) => {
    if (href == str) return

    let url: URL | undefined
    try {
      url = Url.withHttps(str)
    } catch (err: any) {
      setError(err.message)
      return
    }
    if (!url) {
      setHref('')
      setError('')
      setFetchState(false)
      return
    }
    const simpleUrl = Url.withoutHttps(str)?.href
    if (href == simpleUrl) return

    setHref(simpleUrl as string)
    await update(url.href)
  }

  const update = async (url: string) => {
    setFetchState(null) // loading...
    setError('')
    setIcon('')
    setTitle('')
    setUserTitle('')
    setImage('')
    setDesc('')


    let data: FetchResult = { type: LinkType.none }
    if (!forceFramely) {
      try {
        data = await Fetch.proxy(url)
      } catch (err: any) {
        console.log('Fallback', `(${err.message})`)
        try {
          data = await Fetch.proxy(url, true)
        } catch (err: any) {
          console.log('Fallback', `(${err.message})`)
          try {
            data = await Fetch.framely(url)
          } catch (err: any) {
            setError(err.message.replace('Iframely', 'Error :'))
            setFetchState(false)
            return
          }
        }
      }
    }
    if (forceFramely) {
      try {
        data = await Fetch.framely(url)
        setFetchState(true)
      } catch (err: any) {
        setError(err.message.replace('Iframely', 'Error :'))
        setFetchState(false)
        return
      }
    }
    setError('')
    setFetchState(true)
    setType(data.type)
    if (data.icon?.url)
      setIcon(data.icon.url)
    // if (data.icon?.svg)
    //   setSvgIcon(data.icon?.svg)
    setTitle(data.title || '')
    setImage(data.image || '')
    setDesc(data.description || '')
    setIsCode(data.code || false)
  }

  const navigate = (url: string | undefined): Promise<void> => {
    if (!url) return Promise.resolve()
    return new Promise<void>((resolve) => {
      figma.showUI(
        `<script>window.open('${url}', '_blank')</script>`,
        { visible: false }
      )
      setTimeout(resolve, 1000)
    })
  }


  const corners = (radius: number) => ({
    topRight: ImageComponent ? 0 : s(radius),
    bottomRight: vertical ? s(radius) : 0,
    bottomLeft: s(radius),
    topLeft: vertical ? 0 : s(radius)
  })

  // const colors = () => theme == 'light' ? Themes.Light : Themes.Dark
  const colors = theme == Themes.Light ? Colors.Light : Colors.Dark

  const IconComponent =
    icon && <Image
      name='icon'
      src={icon}
      width={s(24)}
      height={s(24)}
    />
  // || svgIcon && <SVG
  //   src={svgIcon}
  //   width={s(24)}
  //   height={s(24)}
  // />

  const DefaultIcon =
    type == LinkType.none ?
      <Frame
        width={s(24)}
        height={s(24)}
        cornerRadius={s(8)}
        fill={accent == defaultAccent ? colors.border : accent}
      ></Frame> :
      <SVG
        src={Icons.type(type, theme)}
        width={s(24)}
        height={s(24)}
      />

  const tagLong = tag.length > 30
  const tagAtBottom = tagLong && !(image && showImage && vertical )
  const tagAtTitle = !tagLong && !(image && showImage )
  const tagOnImage = !tagAtBottom && !tagAtTitle

  const [test, setTest] = useSyncedState('test', false)
  const TagComponent =
    <AutoLayout
      name='TagWrapper'
      padding={tagLong ? {
        horizontal: s(8),
        vertical: s(4)
      } : undefined}
      positioning={ tagOnImage ? 'absolute' : undefined}
      width={tagOnImage ? (vertical ? s(600) : s(160) - s(16)) : undefined}
      y={s(12)}
      horizontalAlignItems={'end'}
      verticalAlignItems={'center'}
    >
      <SVG
        name='AddTag'
        src={Icons.svg.tag(accent == defaultAccent ? colors.txtFaded : accent)}
        hidden={tag.length > 0}
        onClick={() => setTag("tag")}
        width={s(24)}
        height={s(24)}
        opacity={0}
        hoverStyle={{
          opacity: 1
        }}
      />
      <AutoLayout
        name='Tag'
        hidden={tag.length == 0}
        verticalAlignItems={'center'}
        cornerRadius={s(99)}
        fill={accent == defaultAccent ? theme == Themes.Light ? colors.txtFaded : colors.txtFaded : accent}
        padding={{
          horizontal: s(8),
          vertical: s(4)
        }}
      >
        <Text
          name='tag-clone-for-resize'
          fontSize={s(14)}
          width='hug-contents'
          height='hug-contents'
          opacity={0}
        >{tag}</Text>
        <Input
          positioning='absolute'
          x={0} y={0}
          width='fill-parent'
          name='tag'
          value={tag}
          onTextEditEnd={(event) => setTag(event.characters.trim())}
          fill={accent == defaultAccent ? theme == Themes.Light ? colors.bg : colors.bg : colors.bg}
          href=''
          fontSize={s(14)}
          verticalAlignText='center'
          inputBehavior={'truncate'}
          inputFrameProps={{
            name: 'Tag-Input',
            padding: {
              horizontal: s(8),
              vertical: s(4)
            }
          }} />
      </AutoLayout>
    </AutoLayout>

  const ImageComponent = fetchState && showImage && image ? (
    <AutoLayout
      width={vertical ? 'fill-parent' : s(160)}
      height={vertical ? s(160) : 'fill-parent'}
    >
      <Image
        name='Image'
        src={image}
        width='fill-parent'
        height='fill-parent'
      />
      {tagOnImage && TagComponent}
    </AutoLayout>
  ) : null

  const component = (
    <AutoLayout
      name='Wrapper'
      direction={vertical ? 'vertical' : 'horizontal'}
      width={s(600)}
      cornerRadius={s(10)}
      fill={colors.bg}
      // stroke={accent == defaultAccent ? '' : colors.stroke}
      strokeAlign='inside'
    >
      {vertical && ImageComponent}
      <AutoLayout
        name='Content'
        direction='vertical'
        width={'fill-parent'}
        fill={accent == defaultAccent ? colors.border : accent}
        // stroke={accent == defaultAccent ? colors.stroke : accent}
        stroke={colors.stroke}
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
          fill={colors.bg}
          width={'fill-parent'}
          padding={{
            left: s(8),
            right: s(8),
            top: s(8),
            bottom: fetchState && (showUrl || showDesc) ? s(8) : s(4)
          }}
          spacing={isCode ? s(8) : 0}
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
                  onClick={() => navigate(Url.withHttps(href)?.href)}
                >
                  {IconComponent || DefaultIcon}
                </Frame>
                <Input
                  name='Title-Input'
                  placeholder={title}
                  value={userTitle || title}
                  onTextEditEnd={(event) => setUserTitle(event.characters)}
                  width='fill-parent'
                  height='hug-contents'
                  fill={colors.txt}
                  href=''
                  fontSize={s(16)}
                  inputBehavior={'wrap'}
                  inputFrameProps={{
                    hoverStyle: {
                      fill: colors.bgHover
                    },
                    cornerRadius: s(8),
                    padding: s(8),
                    wrap: true
                  }}
                />
                {tagAtTitle && TagComponent}
              </AutoLayout>
              {desc && showDesc ?
                <AutoLayout
                  name='Description'
                  width={'fill-parent'}
                  verticalAlignItems={'center'}
                  padding={isCode ? s(12) : s(8)}
                  cornerRadius={s(5)}
                  fill={isCode ? colors.bgHover : colors.bg}
                >
                  <Text
                    name='description'
                    fontSize={s(14)}
                    width={'fill-parent'}
                    fill={colors.txtFaded}
                    fontFamily={isCode ? 'Source Code Pro' : 'Inter'}
                    fontWeight={isCode ? 'medium' : 'normal'}
                  >{desc}</Text>
                </AutoLayout> : null}
            </> : null}
          <AutoLayout
            name='URL row'
            hidden={!showUrl}
            width={'fill-parent'}
            verticalAlignItems={'center'}
            spacing={s(8)}
            padding={{
              vertical: 0,
              horizontal: s(4)
            }}
            overflow='hidden'
          >
            <Input
              name='url'
              href=''
              value={href}
              onTextEditEnd={(event) => onChange(event.characters)}
              placeholder="https://"
              placeholderProps={{
                fill: colors.txt,
                fontSize: size,
                fontWeight: 400,
              }}
              fontSize={size}
              fontWeight='normal'
              fill={colors.txtFaded}
              width='fill-parent'
              // text wrap on overflow, "Enter" to validate
              inputBehavior='truncate'
              inputFrameProps={{
                name: 'Input',
                hoverStyle: {
                  fill: colors.bgHover
                },
                cornerRadius: s(8),
                padding: s(4),
              }}
            />
            <Text
              name='loading'
              hidden={fetchState != null}
              fontSize={s(13)}
              fill={colors.txtFaded}
            >Loading...</Text>
          </AutoLayout>
          <AutoLayout
            name='Error'
            hidden={!error}
            width={'fill-parent'}
            padding={{
              vertical: s(4),
              horizontal: s(8)
            }}>
            <Text
              name='error'
              fontSize={s(13)}
              width={'fill-parent'}
              fill={colors.error}
            >{error}</Text>
          </AutoLayout>
          {tagAtBottom && TagComponent}
        </AutoLayout>
      </AutoLayout>
      {!vertical && ImageComponent}
    </AutoLayout>
  )


  usePropertyMenu(
    [
      {
        itemType: 'toggle',
        propertyName: 'vertical',
        isToggled: !vertical,
        tooltip: 'Horizontal layout',
        icon: Icons.svg.vertical,
      },
      {
        itemType: 'dropdown',
        propertyName: 'theme',
        tooltip: 'Theme',
        selectedOption: theme,
        options: [
          { label: "Light", option: Themes.Light.toString() },
          { label: "Dark", option: Themes.Dark.toString() },
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
        icon: Icons.svg.url,
      }, {
        itemType: 'toggle',
        propertyName: 'description',
        isToggled: showDesc,
        tooltip: 'Show description',
        icon: Icons.svg.description,
      }, {
        itemType: 'toggle',
        propertyName: 'showImage',
        isToggled: showImage,
        tooltip: 'Show image',
        icon: Icons.svg.image(),
      },
      {
        itemType: 'separator'
      },
      {
        itemType: 'toggle',
        propertyName: 'iframely',
        isToggled: forceFramely,
        tooltip: 'Force API',
        icon: Icons.svg.iframely,
      },
      {
        itemType: 'action',
        propertyName: 'reload',
        tooltip: 'Reload',
        icon: Icons.svg.reload,
      }
    ],
    ({ propertyName, propertyValue }) => {
      if (propertyName === "accent" && propertyValue) {
        setAccent(propertyValue)
      } else if (propertyName === "theme" && propertyValue) {
        setTheme(propertyValue as Themes)
      } else if (propertyName === "description") {
        setShowDesk(!showDesc)
      } else if (propertyName === "showUrl") {
        setShowUrl(!showUrl)
      } else if (propertyName === "showImage") {
        setShowImage(!showImage)
      } else if (propertyName === "size") {
        setSize(Number(propertyValue))
      } else if (propertyName === "iframely") {
        setUseIframely(!forceFramely)
        reload()
      } else if (propertyName === "reload") {
        reload()
      } else if (propertyName === "vertical") {
        setVertical(!vertical)
      }
    }
  )
  return component
}

widget.register(Widget)

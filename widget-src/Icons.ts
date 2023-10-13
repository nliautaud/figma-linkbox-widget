import { LinkType } from './Fetch'
import { Themes, Theme, Colors } from './Themes'

const svg = {

    rss: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="6.18" cy="17.82" r="2.18" fill="#e67e22"/><path fill="#e67e22" d="M5.59 10.23c-.84-.14-1.59.55-1.59 1.4c0 .71.53 1.28 1.23 1.4c2.92.51 5.22 2.82 5.74 5.74c.12.7.69 1.23 1.4 1.23c.85 0 1.54-.75 1.41-1.59a9.894 9.894 0 0 0-8.19-8.18zm-.03-5.71C4.73 4.43 4 5.1 4 5.93c0 .73.55 1.33 1.27 1.4c6.01.6 10.79 5.38 11.39 11.39c.07.73.67 1.28 1.4 1.28c.84 0 1.5-.73 1.42-1.56c-.73-7.34-6.57-13.19-13.92-13.92z"/></svg>',
    
    code: (colors:Theme ) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="${colors.txt}" d="M8.7 15.9L4.8 12l3.9-3.9a.984.984 0 0 0 0-1.4a.984.984 0 0 0-1.4 0l-4.59 4.59a.996.996 0 0 0 0 1.41l4.59 4.6c.39.39 1.01.39 1.4 0a.984.984 0 0 0 0-1.4zm6.6 0l3.9-3.9l-3.9-3.9a.984.984 0 0 1 0-1.4a.984.984 0 0 1 1.4 0l4.59 4.59c.39.39.39 1.02 0 1.41l-4.59 4.6a.984.984 0 0 1-1.4 0a.984.984 0 0 1 0-1.4z"/></svg>`,

    vertical:`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M22 12H2M22 12L19 9M22 12L19 15M2 12L5 9M2 12L5 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    url:`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="1.5"><path d="M10.046 14c-1.506-1.512-1.37-4.1.303-5.779l4.848-4.866c1.673-1.68 4.25-1.816 5.757-.305c1.506 1.512 1.37 4.1-.303 5.78l-2.424 2.433"/><path d="M13.954 10c1.506 1.512 1.37 4.1-.303 5.779l-2.424 2.433l-2.424 2.433c-1.673 1.68-4.25 1.816-5.757.305c-1.506-1.512-1.37-4.1.303-5.78l2.424-2.433"/></g></svg>`,

    description:`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-width="1.5"><path d="M3 10c0-3.771 0-5.657 1.172-6.828C5.343 2 7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172C21 4.343 21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828C18.657 22 16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172C3 19.657 3 17.771 3 14v-4Z"/><path stroke-linecap="round" d="M8 12h8M8 8h8m-8 8h5"/></g></svg>`,

    image:`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-width="1.5"><path d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2c4.714 0 7.071 0 8.535 1.464C22 4.93 22 7.286 22 12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z"/><circle cx="16" cy="8" r="2"/><path stroke-linecap="round" d="m5 13.307l.81-.753a2.3 2.3 0 0 1 3.24.108l2.647 2.81c.539.572 1.42.649 2.049.18a2.317 2.317 0 0 1 2.986.181L19 18"/></g></svg>`,

    iframely:`<svg width="96" height="96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m22.764 54.08 20.494-16.585V25.48L16.666 49.003l6.098 5.078Zm3.895 3.216 16.599 13.878V59.158l-9.655-7.785-6.944 5.923ZM69.34 39.865 52.742 25.479v12.185l9.824 7.785 6.774-5.584Zm3.727 3.046L52.912 59.327v11.847l26.421-22.848-6.266-5.415Z" fill="#fff"/></svg>`,

    reload:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#fff" d="M19.295 12a.704.704 0 0 1 .705.709v3.204a.704.704 0 0 1-.7.709a.704.704 0 0 1-.7-.709v-1.125C16.779 17.844 13.399 20 9.757 20c-4.41 0-8.106-2.721-9.709-6.915a.712.712 0 0 1 .4-.917c.36-.141.766.04.906.405c1.4 3.662 4.588 6.01 8.403 6.01c3.371 0 6.52-2.182 7.987-5.154l-1.471.01a.704.704 0 0 1-.705-.704a.705.705 0 0 1 .695-.714L19.295 12Zm-9.05-12c4.408 0 8.105 2.721 9.708 6.915a.712.712 0 0 1-.4.917a.697.697 0 0 1-.906-.405c-1.4-3.662-4.588-6.01-8.403-6.01c-3.371 0-6.52 2.182-7.987 5.154l1.471-.01a.704.704 0 0 1 .705.704a.705.705 0 0 1-.695.714L.705 8A.704.704 0 0 1 0 7.291V4.087c0-.392.313-.709.7-.709c.386 0 .7.317.7.709v1.125C3.221 2.156 6.601 0 10.243 0Z"/></svg>`,
}


const type = (t: LinkType, theme: Themes) => {
  switch (t) {
    case LinkType.code:
      return svg.code(Colors.get(theme))
    case LinkType.rss:
      return svg.rss
    default:
      return ''
  }
}

export const Icons = {
  type,
  svg
}
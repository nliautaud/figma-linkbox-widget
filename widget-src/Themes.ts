export interface Theme {
  bg: string
  bgHover: string
  txt: string
  txtFaded: string
  stroke: { r: number, g: number, b: number, a: number }
  border: string
  error: string
}
export const Light: Theme = {
  bg: "#fff",
  bgHover: "#f3f3f3",
  txt: "#000",
  txtFaded: "#555",
  stroke: { r: 0, g: 0, b: 0, a: .1 },
  border: "#eee",
  error: "#EF1818",
}
export const Dark: Theme = {
  bg: "#333",
  bgHover: "#3a3a3a",
  txt: "#fff",
  txtFaded: "#bbb",
  stroke: { r: 1, g: 1, b: 1, a: .1 },
  border: "#282828",
  error: "#D62E2E",
}
export enum Themes {
  Light = "light",
  Dark = "dark"
}
export const Colors = {
  get: (t: Themes) => {
    switch (t) {
      case Themes.Light:
        return Light
      case Themes.Dark:
        return Dark
    }
  },
  Light,
  Dark
}
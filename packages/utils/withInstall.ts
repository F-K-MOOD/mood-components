import type { App, Component } from 'vue'

export function withInstall<T extends Component>(component: T, name?: string) {
  ;(component as any).install = (app: App) => {
    const componentName = name || component.name
    app.component(componentName as string, component)
  }
  return component
}

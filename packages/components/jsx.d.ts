import { VNode } from 'vue'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
    interface Element extends VNode {}
    interface ElementClass extends VNode {}
    interface ElementAttributesProperty {
      $props: any
    }
  }
}

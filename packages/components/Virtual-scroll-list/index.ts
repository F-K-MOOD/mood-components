import { withInstall } from '@xuqizhang/utils'

import _VirtualScrollList from './Virtual-scroll-list'


const MVirtualScrollList = withInstall(_VirtualScrollList, 'MVirtualScrollList')
export { MVirtualScrollList }

declare module 'vue' {
  export interface GlobalComponents {
    MVirtualScrollList: typeof _VirtualScrollList
  }
}

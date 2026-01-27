import { withInstall } from '@xuqizhang/utils'

import _VirtualList from './virtual-list'

const MVirtualList = withInstall(_VirtualList, 'MVirtualList')
export { MVirtualList }
export default MVirtualList

declare module 'vue' {
  export interface GlobalComponents {
    MVirtualList: typeof _VirtualList
  }
}

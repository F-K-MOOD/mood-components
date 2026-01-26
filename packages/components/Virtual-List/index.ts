import { withInstall } from '@xuqizhang/utils'
import VirtualList from './virtual-list'

export default withInstall(VirtualList, 'MVirtualList')

declare module 'vue' {
  export interface GlobalComponents {
    MVirtualList: typeof VirtualList
  }
}

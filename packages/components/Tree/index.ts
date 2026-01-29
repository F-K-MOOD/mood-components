import { withInstall } from '@xuqizhang/utils'

import _Tree from './Tree.vue'
import MTreeNode from './TreeNode.vue'

const MTree = withInstall(_Tree, 'MTree')
export { MTree, MTreeNode }

declare module 'vue' {
  export interface GlobalComponents {
    MTree: typeof _Tree
    MTreeNode: typeof MTreeNode
  }
}

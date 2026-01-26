import Tree from './Tree.vue'
import MTreeNode from './TreeNode.vue'
import { withInstall } from '@xuqizhang/utils'

export default withInstall(Tree, 'MTree')
export { MTreeNode }

declare module 'vue' {
  export interface GlobalComponents {
    MTree: typeof Tree
    MTreeNode: typeof MTreeNode
  }
}

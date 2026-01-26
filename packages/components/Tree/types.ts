import type { InjectionKey, SetupContext } from 'vue'

export interface TreeProps {
  /** 树形数据源 */
  data?: TreeOption[]
  /** 标签字段名 */
  labelField?: string
  /** 键值字段名 */
  keyField?: string
  /** 子节点字段名 */
  childrenField?: string
  /** 默认展开的节点键值数组 */
  defaultExpandedKeys?: (string | number)[]
  onLoad?: (node: TreeOption) => Promise<TreeOption[]>
  /** 是否支持选择节点 */
  selectable?: boolean
  /** 是否支持多选 */
  multiple?: boolean
  /** 选中的节点键值数组 */
  selectedKeys?: (string | number)[]
}

export interface TreeOption {
  children?: TreeOption[]
  /** 是否为叶子节点（用于异步加载） */
  isLeaf?: boolean
  /** 是否禁用树节点 */
  disabled?: boolean
  [key: string]: any
}

export interface TreeNode {
  /** 节点的唯一标识（从原始数据的keyField字段转换而来） */
  key: string | number
  /** 显示文本（从原始数据的labelField字段转换而来） */
  label: string | number
  /** 节点层级 */
  level: number
  /** 原始数据节点 */
  rawNode: TreeOption
  /** 是否为叶子节点 */
  isLeaf: boolean
  /** 转换后的子节点 */
  children?: TreeNode[]
  /** 是否禁用树节点 */
  disabled: boolean
}

export interface TreeNodeEmit {
  (e: 'toggle', node: TreeNode): void
  (e: 'select', node: TreeNode): void
}

export interface TreeEmit {
  (e: 'update:selectedKeys', selectedKeys: (string | number)[]): void
}

export interface TreeNodeProps {
  node: TreeNode
  loadingKeys: Set<string | number>
  selectedKeys: Set<string | number>
}

export interface TreeContext {
  slots: SetupContext['slots']
}

export const treeContextKey: InjectionKey<TreeContext> = Symbol('treeContext')

<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, ref, useSlots, watch } from 'vue'
import { provide } from 'vue'

import MVirtualList from '../Virtual-List'
import MTreeNode from './TreeNode.vue'
import type { TreeContext, TreeEmit, TreeNode, TreeOption, TreeProps } from './types'
import { treeContextKey } from './types'

defineOptions({
  name: 'MTree',
})

// ========== props定义, emits定义 ==========
const props = withDefaults(defineProps<TreeProps>(), {
  data: () => [],
  labelField: 'label',
  keyField: 'key',
  childrenField: 'children',
  defaultExpandedKeys: () => [],
  selectable: true,
  multiple: false,
  showCheckbox: false,
  defaultCheckedKeys: () => [],
  checkedKeys: () => [],
})
const emit = defineEmits<TreeEmit>()

// ========== 基本展示 ==========
// 格式化后的树形数据
const formattedTreeData: Ref<TreeNode[]> = ref([])
// 正在加载的节点键值集合
const loadingKeys = ref(new Set<string | number>())
// 创建字段访问器
function createFieldAccessor(keyField: string, labelField: string, childrenField: string) {
  return {
    getKeyFromRawNode(node: TreeOption): string | number {
      return node[keyField] as string | number
    },
    getLabelFromRawNode(node: TreeOption): string | number {
      return node[labelField] as string | number
    },
    getChildrenFromRawNode(node: TreeOption): TreeOption[] {
      return node[childrenField] as TreeOption[]
    },
  }
}
// 递归转换原始数据为TreeNode
function transformToTreeNode(
  data: TreeOption[],
  fieldAccessor: ReturnType<typeof createFieldAccessor>,
  parentNode: TreeNode | null = null,
): TreeNode[] {
  return data.map((rawNode) => {
    const currentLevel = parentNode ? parentNode.level + 1 : 0
    const rawChildren = fieldAccessor.getChildrenFromRawNode(rawNode)
    const hasChildren = rawChildren && rawChildren.length > 0

    // 创建当前节点
    const currentNode: TreeNode = {
      key: fieldAccessor.getKeyFromRawNode(rawNode),
      label: fieldAccessor.getLabelFromRawNode(rawNode),
      level: currentLevel,
      parent: parentNode,
      rawNode,
      isLeaf: rawNode.isLeaf ?? !hasChildren,
      disabled: rawNode.disabled ?? false,
    }
    // 递归处理子节点
    if (hasChildren && rawChildren) {
      currentNode.children = transformToTreeNode(rawChildren, fieldAccessor, currentNode)
    }
    return currentNode
  })
}
const fieldAccessor = computed(() => createFieldAccessor(props.keyField, props.labelField, props.childrenField))
watch(
  () => props.data,
  (newData) => {
    if (!newData || newData.length === 0) {
      formattedTreeData.value = []
      return
    }
    // 使用fieldAccessor.value进行转换
    formattedTreeData.value = transformToTreeNode(newData, fieldAccessor.value)
  },
  {
    immediate: true,
    deep: true,
  },
)

// 支持默认展开节点
const flattenedTreeData = computed(() => {
  // 要展开的keys有哪些
  let expandedKeys = [...expandedKeysSet.value]
  // 最终拍平的节点
  let flattenedNotes: TreeNode[] = []
  // 被格式化后的节点
  const nodes = formattedTreeData.value
  // 栈，用来遍历树的栈
  const stack: TreeNode[] = []

  for (let i = nodes.length - 1; i >= 0; i--) {
    stack.push(nodes[i])
  }
  // 遍历栈，将节点压入拍平数组
  while (stack.length > 0) {
    const currentNode = stack.pop()
    if (!currentNode) continue
    flattenedNotes.push(currentNode)
    if (expandedKeys.includes(currentNode.key as string | number)) {
      // 如果当前节点展开，将其子节点压入栈
      if (currentNode.children) {
        for (let j = currentNode.children.length - 1; j >= 0; j--) {
          stack.push(currentNode.children[j])
        }
      }
    }
  }
  return flattenedNotes
})

// 展开的节点键值数组
const expandedKeysSet = ref(new Set(props.defaultExpandedKeys || []))

// 处理节点展开折叠 
async function handleToggle(node: TreeNode) {
  const nodeKey = node.key
  const isExpanded = expandedKeysSet.value.has(nodeKey)

  if (isExpanded) {
    // 折叠节点
    expandedKeysSet.value.delete(nodeKey)
  } else {
    // 展开节点
    if (!node.isLeaf && !node.children && props.onLoad) {
      // 异步加载子节点
      loadingKeys.value.add(nodeKey)
      try {
        const children = await props.onLoad(node.rawNode)
        // 更新原始数据
        node.rawNode[props.childrenField] = children
        // 重新转换数据
        formattedTreeData.value = transformToTreeNode(props.data, fieldAccessor.value)
        // 展开节点
        expandedKeysSet.value.add(nodeKey)
      } catch (error) {
        console.error('加载子节点失败:', error)
      } finally {
        loadingKeys.value.delete(nodeKey)
      }
    } else {
      // 直接展开节点
      expandedKeysSet.value.add(nodeKey)
    }
  }
}

// 支持选中节点
const selectedKeysRef = ref(new Set(props.selectedKeys || []))
watch(
  () => props.selectedKeys,
  (newSelectedKeys) => {
    selectedKeysRef.value = new Set(newSelectedKeys || [])
  },
  {
    immediate: true,
  },
)
// 处理选中节点事件
function handleSelect(node: TreeNode) {
  // 检查是否支持选择节点
  if (!props.selectable) return
  const nodeKey = node.key
  const isSelected = selectedKeysRef.value.has(nodeKey)

  if (isSelected) {
    // 取消选中节点
    selectedKeysRef.value.delete(nodeKey)
  } else {
    // 选中节点
    if (props.multiple) {
      // 多选模式，直接添加到选中集合
      selectedKeysRef.value.add(nodeKey)
    } else {
      // 单选模式，先清空集合再添加
      selectedKeysRef.value.clear()
      selectedKeysRef.value.add(nodeKey)
    }
  }
  // 触发选中键值数组更新事件
  emit('update:selectedKeys', [...selectedKeysRef.value])
}

// 支持复选框选择节点
const checkedKeysRef = ref(new Set(props.defaultCheckedKeys || []))
function isChecked(node: TreeNode) {
  return checkedKeysRef.value.has(node.key)
}

// 检查节点是否禁用
function isDisabled(node: TreeNode) {
  return node.disabled || false
}

// 计算节点是否半选
function isIndeterminate(node: TreeNode) {
  if (!node.children || node.children.length === 0) {
    return false
  }

  let checkedCount = 0
  let totalCount = 0

  function checkChildren(children: TreeNode[]) {
    for (const child of children) {
      if (!child.disabled) {
        totalCount++
        if (isChecked(child)) {
          checkedCount++
        }
        if (child.children && child.children.length > 0) {
          checkChildren(child.children)
        }
      }
    }
  }

  checkChildren(node.children)

  return totalCount > 0 && checkedCount > 0 && checkedCount < totalCount
}

// 级联选择：选择/取消选择所有子节点
function cascadeSelect(node: TreeNode, checked: boolean) {
  if (!node.children || node.children.length === 0) {
    return
  }

  function cascade(node: TreeNode, checked: boolean) {
    if (!node.disabled) {
      if (checked) {
        checkedKeysRef.value.add(node.key)
      } else {
        checkedKeysRef.value.delete(node.key)
      }
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        cascade(child, checked)
      }
    }
  }

  cascade(node, checked)
}

// 反向级联：更新父节点状态
function updateParentStatus(node: TreeNode) {
  let currentNode = node

  // 向上遍历所有父节点
  while (currentNode.parent) {
    const parent = currentNode.parent
    const allChecked = parent.children?.every((child) => !child.disabled && isChecked(child)) || false
    const noneChecked = parent.children?.every((child) => child.disabled || !isChecked(child)) || true

    if (allChecked) {
      checkedKeysRef.value.add(parent.key)
    } else if (noneChecked) {
      checkedKeysRef.value.delete(parent.key)
    }
    // 半选状态由 isIndeterminate 计算
    currentNode = parent
  }
}

// 处理复选框点击事件
function handleCheck(node: TreeNode, checked: boolean) {
  if (node.disabled) {
    return
  }

  // 更新当前节点状态
  if (checked) {
    checkedKeysRef.value.add(node.key)
  } else {
    checkedKeysRef.value.delete(node.key)
  }

  // 级联更新子节点
  cascadeSelect(node, checked)

  // 反向级联更新父节点
  updateParentStatus(node)

  // 触发选中键值数组更新事件
  emit('update:checkedKeys', [...checkedKeysRef.value])
}

watch(
  () => props.defaultCheckedKeys,
  (newCheckedKeys) => {
    checkedKeysRef.value = new Set(newCheckedKeys || [])
  },
  {
    immediate: true,
  },
)

// 监听 checkedKeys 变化（用于 v-model:checkedKeys）
watch(
  () => props.checkedKeys,
  (newCheckedKeys) => {
    if (newCheckedKeys) {
      checkedKeysRef.value = new Set(newCheckedKeys)
    }
  },
  {
    immediate: true,
  },
)

// 支持自定义节点, 使用插槽来实现
const treeContext: TreeContext = {
  slots: useSlots(),
}
provide(treeContextKey, treeContext)
</script>

<template>
  <div>
    <MVirtualList
      :data-source="flattenedTreeData"
      :remain="10"
      :item-height="40"
    >
      <template #default="{ node }">
        <div :style="{ paddingLeft: node.level * 20 + 'px' }">
          <MTreeNode
            :node="node"
            :loading-keys="loadingKeys"
            :selected-keys="selectedKeysRef"
            :show-checkbox="props.showCheckbox"
            :checked="isChecked(node)"
            :indeterminate="isIndeterminate(node)"
            :disabled="isDisabled(node)"
            @toggle="handleToggle"
            @select="handleSelect"
            @check="handleCheck"
          />
        </div>
      </template>
    </MVirtualList>
  </div>
</template>

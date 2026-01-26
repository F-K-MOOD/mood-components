<script setup lang="ts">
import { computed } from 'vue'

import TreeNodeContext from './tree-node-context'
import type { TreeNode, TreeNodeEmit, TreeNodeProps } from './types'


const props = defineProps<TreeNodeProps>()
const emit = defineEmits<TreeNodeEmit>()

function toggle(node: TreeNode) {
  emit('toggle', node)
}

function handleNodeClick(node: TreeNode) {
  if (!isDisabled.value) {
    emit('select', node)
  }
}

const isLoading = computed(() => props.loadingKeys.has(props.node.key))
const hasChildren = computed(() => !props.node.isLeaf)
const isSelected = computed(() => props.selectedKeys.has(props.node.key))
const isDisabled = computed(() => props.node.disabled)

</script>

<template>
  <div :class="{ 'node-selected': isSelected }">
    <div>
      <span v-if="!isDisabled" @click="toggle(props.node)">
        <template v-if="isLoading">
          <!-- 加载图标 -->
          <span class="loading-icon" />
        </template>
        <template v-else-if="hasChildren">
          <!-- 展开/折叠图标 -->
          <span class="expand-icon">▼</span>
        </template>
        <template v-else>
          <!-- 叶子节点图标 -->
          <span class="leaf-icon" />
        </template>
      </span>
      <span @click="handleNodeClick(props.node)">
        <TreeNodeContext.Provider :value="props.node" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.loading-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.expand-icon {
  width: 16px;
  display: inline-block;
}

.leaf-icon {
  width: 16px;
  display: inline-block;
}

.node-selected {
  background-color: #e6f7ff;
  border-radius: 4px;
}

.node-selected span {
  color: #1890ff;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>

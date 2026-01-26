import { computed, defineComponent, inject } from "vue";
import { treeContextKey, type TreeNode } from "./types";

export default defineComponent({
  name: 'TreeNodeContext',
  props: {
    node: {
      type: Object as () => TreeNode,
      required: true,
    },
  },
  setup(props) {
    const treeContext = inject(treeContextKey)
    const node = computed(() => props.node)
    return () => {
      return treeContext?.slots?.default ? treeContext.slots.default(node.value) : node.value.label
    }
  }
})
import {
  defineComponent,
  ref,
  onMounted,
  reactive,
  computed,
  watch,
  onUnmounted,
} from "vue";
import type { VirtualListProps } from "./types";
import { throttle } from "lodash-es";

export default defineComponent<VirtualListProps>({
  name: "MVirtualList",
  props: {
    dataSource: {
      type: Array,
      default: () => [],
      required: true,
    },
    remain: {
      type: Number,
      default: 10,
      validator: (value: number) => value > 0,
    },
    itemHeight: {
      type: Number,
      default: 40,
      validator: (value: number) => value > 0,
    },
  },
  setup(props, { slots }) {
    const wrapperRef = ref<HTMLElement | null>(null);
    const barRef = ref<HTMLElement | null>(null);

    // 计算显示区
    const state = reactive({
      start: 0,
      end: props.remain,
    });

    // 缓冲区大小
    const bufferSize = 8;

    const visibleData = computed(() => {
      // 计算实际的开始和结束索引，包含缓冲区
      const actualStart = Math.max(0, state.start - bufferSize);
      const actualEnd = Math.min(
        props.dataSource.length,
        state.end + bufferSize,
      );
      return props.dataSource.slice(actualStart, actualEnd);
    });

    onMounted(() => {
      updateContainerHeight();
    });

    // 监听 props 变化，更新容器高度
    watch(
      () => [props.remain, props.itemHeight],
      () => {
        updateContainerHeight();
      },
    );

    // 更新容器高度
    function updateContainerHeight() {
      if (wrapperRef.value) {
        wrapperRef.value.style.height = `${props.remain * props.itemHeight}px`;
        wrapperRef.value.style.overflow = "auto";
        wrapperRef.value.style.position = "relative";
      }
      if (barRef.value) {
        barRef.value.style.height = `${props.dataSource.length * props.itemHeight}px`;
      }
    }

    // 滚动事件 - 使用 lodash-es 的 throttle 优化性能
    const offset = ref(0);

    const handleScroll = throttle(() => {
      if (wrapperRef.value) {
        const scrollTop = wrapperRef.value.scrollTop;
        state.start = Math.max(0, Math.floor(scrollTop / props.itemHeight));
        state.end = Math.min(
          props.dataSource.length,
          state.start + props.remain,
        );
        // 计算偏移量，基于实际的开始索引（包含缓冲区）
        const actualStart = Math.max(0, state.start - bufferSize);
        offset.value = actualStart * props.itemHeight;
      }
    }, 16); // 约 60fps

    onUnmounted(() => {
      handleScroll.cancel();
    });

    return () => {
      if (!slots.default) {
        return null;
      }

      return (
        <div
          ref={wrapperRef}
          onScroll={handleScroll}
          style={{
            position: "relative",
            overflow: "auto",
            width: "100%",
          }}
        >
          {/* 滚动占位符 */}
          <div
            ref={barRef}
            style={{
              height: `${props.dataSource.length * props.itemHeight}px`,
              width: "100%",
              pointerEvents: "none",
            }}
          />
          {/* 可见数据区域 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${offset.value}px)`,
              pointerEvents: "auto",
            }}
          >
            {visibleData.value.map((node, idx) => {
              // 计算实际的索引，考虑缓冲区
              const actualStart = Math.max(0, state.start - bufferSize);
              const actualIndex = actualStart + idx;
              return slots.default!({
                node,
                index: actualIndex,
              });
            })}
          </div>
        </div>
      );
    };
  },
});

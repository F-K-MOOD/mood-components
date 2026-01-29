import { throttle } from 'lodash-es'
import type { PropType } from 'vue'
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'

const enum CALC_TYPE {
  INIT = 'init',
  FIXED = 'fixed',
  DYNAMIC = 'dynamic',
}

export default defineComponent({
  name: 'VirtualScrollList',
  props: {
    dataSource: {
      type: Array as PropType<any[]>,
      required: true,
      default: () => [],
    },
    dataKey: {
      type: String,
      required: true,
    },
    remainCount: {
      type: Number,
      default: 30,
    },
    estimatedItemSize: {
      type: Number,
      default: 80,
    },
    dataComponent: {
      type: [Object, Function] as PropType<any>,
      required: true,
    },
  },
  setup(props) {
    const { dataSource, dataKey, remainCount, estimatedItemSize } = props

    const wrapperRef = ref<HTMLElement | null>(null)
    const barRef = ref<HTMLElement | null>(null)
    const itemRefs = ref<Map<number, HTMLElement>>(new Map())
    const observersRef = ref<Map<number, ResizeObserver>>(new Map())
    
    // 高度计算相关状态
    let calcType = CALC_TYPE.INIT
    const sizeMap = new Map<number, number>()
    let fixedSize = 0
    
    // 保存项目实际高度
    function saveItemSize(index: number, size: number) {
      const oldSize = sizeMap.get(index)
      if (oldSize !== size) {
        sizeMap.set(index, size)
        
        if (calcType === CALC_TYPE.INIT) {
          calcType = CALC_TYPE.FIXED
          fixedSize = size
        } else if (calcType === CALC_TYPE.FIXED && size !== fixedSize) {
          calcType = CALC_TYPE.DYNAMIC
        }
        
        // 动态模式下，高度变化需要触发重新计算
        if (calcType === CALC_TYPE.DYNAMIC) {
          handleScroll()
        }
      }
    }
    
    // 测量元素高度
    function measureItemSize(element: HTMLElement, index: number) {
      const { height } = element.getBoundingClientRect()
      saveItemSize(index, height)
      
      // 设置 ResizeObserver 监听高度变化
      const observer = new ResizeObserver((entries) => {
        // entries 是一个数组，包含所有发生尺寸变化的元素信息
        for (const entry of entries) {
          saveItemSize(index, entry.contentRect.height)
        }
      })
      observer.observe(element)
      
      // 保存 observer 以便清理
      observersRef.value.set(index, observer)
    }
    
    // 清理 observer
    function cleanupObserver(index: number) {
      const observer = observersRef.value.get(index)
      if (observer) {
        observer.disconnect()
        observersRef.value.delete(index)
      }
    }
    
    function isFixed() {
      return calcType === CALC_TYPE.FIXED
    }
    
    function getEstimatedItemSize() {
      if (isFixed()) {
        return fixedSize
      } else {
        // 通过第一次的remainCount项目数, 计算平均高度
        if (sizeMap.size > 0 && sizeMap.size <= remainCount) {
          const sizes = Array.from(sizeMap.values())
          return sizes.reduce((acc, cur) => acc + cur, 0) / sizes.length
        }
        return estimatedItemSize
      }
    }

    // 计算滚动条总高度
    const totalHeight = computed(() => {
      if (isFixed()) {
        return dataSource.length * fixedSize
      } else {
        const estimatedSize = getEstimatedItemSize()
        let total = 0
        
        // 动态模式下：累加已测量的高度，未测量的使用估算值
        for (let i = 0; i < dataSource.length; i++) {
          total += sizeMap.get(i) || estimatedSize
        }
        
        return total
      }
    })

    // 滚动状态
    const state = ref({
      startIndex: 0,
      endIndex: Math.min(remainCount, dataSource.length),
    })
    
    // 可见项目
    const visibleItems = computed(() => 
      dataSource.slice(state.value.startIndex, state.value.endIndex)
    )
    
    // 内容偏移量
    const offset = ref(0)

    // 根据滚动位置计算起始索引
    function calculateStartIndexDynamic(scrollTop: number): number {
      let accumulatedHeight = 0
      const estimatedSize = getEstimatedItemSize()
      
      for (let i = 0; i < dataSource.length; i++) {
        const itemHeight = sizeMap.get(i) || estimatedSize
        if (accumulatedHeight + itemHeight > scrollTop) {
          return i
        }
        accumulatedHeight += itemHeight
      }
      return Math.max(0, dataSource.length - 1)
    }

    // 计算起始位置的偏移量
    function calculateOffsetDynamic(startIndex: number): number {
      let offset = 0
      const estimatedSize = getEstimatedItemSize()
      
      for (let i = 0; i < startIndex; i++) {
        offset += sizeMap.get(i) || estimatedSize
      }
      return offset
    }

    // 滚动处理函数
    function handleScroll() {
      if (!wrapperRef.value) return

      const scrollTop = wrapperRef.value.scrollTop
      let startIndex: number
      let newOffset: number
      
      if (isFixed()) {
        startIndex = Math.max(0, Math.floor(scrollTop / fixedSize))
        newOffset = startIndex * fixedSize
      } else {
        startIndex = calculateStartIndexDynamic(scrollTop)
        newOffset = calculateOffsetDynamic(startIndex)
      }
      
      const endIndex = Math.min(
        dataSource.length,
        startIndex + remainCount
      )
      
      offset.value = newOffset
      state.value = {
        startIndex,
        endIndex,
      }
    }

    // 节流处理
    const handleScrollThrottle = throttle(handleScroll, 16)

    // 设置容器高度
    function updateContainerHeight() {
      if (wrapperRef.value) {
        wrapperRef.value.style.height = `${remainCount * getEstimatedItemSize()}px`
      }
    }

    // 清理所有 observers
    function cleanupAllObservers() {
      observersRef.value.forEach((observer) => {
        observer.disconnect()
      })
      observersRef.value.clear()
    }

    // 监听数据源变化
    watch(() => props.dataSource, () => {
      // 数据变化时清理旧的高度信息
      sizeMap.clear()
      cleanupAllObservers()
      state.value = {
        startIndex: 0,
        endIndex: Math.min(remainCount, dataSource.length),
      }
      offset.value = 0
      handleScroll()
    })

    onMounted(() => {
      updateContainerHeight()
      if (wrapperRef.value) {
        wrapperRef.value.addEventListener('scroll', handleScrollThrottle)
      }
    })

    onUnmounted(() => {
      if (wrapperRef.value) {
        wrapperRef.value.removeEventListener('scroll', handleScrollThrottle)
      }
      handleScrollThrottle.cancel()
      cleanupAllObservers()
    })

    return () => {
      const DataComponent = props.dataComponent

      return (
        <div
          ref={wrapperRef}
          style={{
            position: 'relative',
            overflow: 'auto',
            width: '100%',
          }}
        >
          <div
            ref={barRef}
            style={{
              height: `${totalHeight.value}px`,
              width: '100%',
              pointerEvents: 'none',
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${offset.value}px)`,
              pointerEvents: 'auto',
            }}
          >
            {visibleItems.value.map((node: any, idx) => {
              const actualIndex = state.value.startIndex + idx
              
              return (
                <div
                  key={node[dataKey] || actualIndex}
                  ref={(el: HTMLElement) => {
                    if (el) {
                      itemRefs.value.set(actualIndex, el)
                      measureItemSize(el, actualIndex)
                    } else {
                      // 元素被卸载时清理
                      cleanupObserver(actualIndex)
                      itemRefs.value.delete(actualIndex)
                    }
                  }}
                >
                  <DataComponent
                    data={node}
                    index={actualIndex}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  },
})
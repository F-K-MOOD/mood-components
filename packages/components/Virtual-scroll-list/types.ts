import type { Component } from 'vue'

export interface DataType {
  [key: string]: any
}

export interface VirtualScrollListProps {
  dataSource: any[]
  dataKey: string
  remainCount: number
  estimatedItemSize: number
  bufferCount?: number
  dataComponent: Component | any
}

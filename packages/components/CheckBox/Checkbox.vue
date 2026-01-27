<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import type { CheckboxEmits, CheckboxProps } from './types.ts'

defineOptions({
  name: 'MCheckBox',
})

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  disabled: false,
})
const emit = defineEmits<CheckboxEmits>()

const model = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const inputRef = ref<HTMLInputElement>()

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  const value = target.checked ? true : false
  emit('change', value)
}

function setIndeterminate(val: boolean) {
  if (inputRef.value) {
    inputRef.value.indeterminate = val
  }
}

watch(
  () => props.indeterminate,
  (newVal) => {
    setIndeterminate(newVal)
  },
)

onMounted(() => {
  setIndeterminate(props.indeterminate)
})
</script>

<template>
  <label
    class="m-checkbox"
    :class="{ 'is-disabled': disabled }"
  >
    <span class="m-checkbox__input">
      <span
        class="m-checkbox__inner"
        :class="{
          'is-checked': model,
          'is-indeterminate': indeterminate && !model,
        }"  
      >
        <input
          ref="inputRef"
          v-model="model"
          type="checkbox"
          class="m-checkbox__original"
          :disabled="disabled"
          @change="handleChange"
        >
      </span>
    </span>
    <span
      v-if="label || $slots.default"
      class="m-checkbox__label"
    >
      <slot />
      <template v-if="!$slots.default">{{ label }}</template>
    </span>
  </label>
</template>

<style scoped>
.m-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #606266;
}

.m-checkbox.is-disabled {
  cursor: not-allowed;
  color: #c0c4cc;
}

.m-checkbox__input {
  display: inline-flex;
  align-items: center;
  position: relative;
  white-space: nowrap;
  line-height: 1;
  outline: none;
}

.m-checkbox__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 14px;
  height: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background-color: #fff;
  cursor: pointer;
  transition:
    border-color 0.25s cubic-bezier(0.71, -0.46, 0.29, 1.46),
    background-color 0.25s cubic-bezier(0.71, -0.46, 0.29, 1.46);
}

.m-checkbox__inner:hover {
  border-color: #409eff;
}

.m-checkbox__inner.is-checked {
  background-color: #409eff;
  border-color: #409eff;
}

.m-checkbox__inner.is-indeterminate {
  background-color: #409eff;
  border-color: #409eff;
}

.m-checkbox__inner.is-checked::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 8px;
  border: 2px solid #fff;
  border-left: 0;
  border-top: 0;
  transform: rotate(45deg) scaleY(1);
  transform-origin: center;
}

.m-checkbox__inner.is-indeterminate::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 2px;
  background-color: #fff;
  border: none;
  transform: none;
}

.m-checkbox__original {
  position: absolute;
  opacity: 0;
  outline: none;
  margin: 0;
  width: 0;
  height: 0;
  z-index: -1;
}

.m-checkbox__label {
  margin-left: 8px;
  line-height: 1;
}

.m-checkbox.is-disabled .m-checkbox__inner {
  background-color: #edf2fc;
  border-color: #dcdfe6;
  cursor: not-allowed;
}

.m-checkbox.is-disabled .m-checkbox__inner.is-checked {
  background-color: #edf2fc;
  border-color: #dcdfe6;
}

.m-checkbox.is-disabled .m-checkbox__inner.is-indeterminate {
  background-color: #edf2fc;
  border-color: #dcdfe6;
}

.m-checkbox.is-disabled .m-checkbox__inner.is-checked::after {
  border-color: #c0c4cc;
}

.m-checkbox.is-disabled .m-checkbox__inner.is-indeterminate::after {
  background-color: #c0c4cc;
}
</style>

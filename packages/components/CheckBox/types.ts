export interface CheckboxProps {
  modelValue: boolean
  disabled?: boolean
  indeterminate?: boolean
  label?: string
}

export interface CheckboxEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

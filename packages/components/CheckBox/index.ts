import { withInstall } from '@xuqizhang/utils'

import _CheckBox from './Checkbox.vue'

const MCheckBox = withInstall(_CheckBox, 'MCheckBox')
export { MCheckBox }
export default MCheckBox

declare module 'vue' {
  export interface GlobalComponents {
    MCheckBox: typeof _CheckBox
  }
}

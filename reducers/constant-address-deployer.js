import { CONSTANT_ADDRESS_DEPLOYER } from './types'

export default (
  state = {
    [CONSTANT_ADDRESS_DEPLOYER]: null,
  },
  action,
) => {
  switch (action.type) {
    case CONSTANT_ADDRESS_DEPLOYER:
      return {
        ...state,
        [CONSTANT_ADDRESS_DEPLOYER]: action.value,
      }
    default:
      return state
  }
}
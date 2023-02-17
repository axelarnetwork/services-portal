import { GAS_SERVICE_ADDRESSES_DATA } from './types'

export default (
  state = {
    [GAS_SERVICE_ADDRESSES_DATA]: null,
  },
  action,
) => {
  switch (action.type) {
    case GAS_SERVICE_ADDRESSES_DATA:
      return {
        ...state,
        [GAS_SERVICE_ADDRESSES_DATA]: action.value,
      }
    default:
      return state
  }
}
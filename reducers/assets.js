import { ASSETS_DATA } from './types'

export default (
  state = {
    [ASSETS_DATA]: null,
  },
  action,
) => {
  switch (action.type) {
    case ASSETS_DATA:
      return {
        ...state,
        [ASSETS_DATA]: action.value,
      }
    default:
      return state
  }
}
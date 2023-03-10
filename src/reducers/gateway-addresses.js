import { GATEWAY_ADDRESSES_DATA } from "./types";

export const gateway_addresses = (
  state = {
    [GATEWAY_ADDRESSES_DATA]: null,
  },
  action
) => {
  switch (action.type) {
    case GATEWAY_ADDRESSES_DATA:
      return {
        ...state,
        [GATEWAY_ADDRESSES_DATA]: action.value,
      };
    default:
      return state;
  }
};

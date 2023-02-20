import { RPCS } from "./types";

export const rpc_providers = (
  state = {
    [RPCS]: null,
  },
  action
) => {
  switch (action.type) {
    case RPCS:
      return {
        ...state,
        [RPCS]: action.value,
      };
    default:
      return state;
  }
};

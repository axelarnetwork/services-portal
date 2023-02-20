import { EVM_CHAINS_DATA } from "./types";

export const evm_chains = (
  state = {
    [EVM_CHAINS_DATA]: null,
  },
  action
) => {
  switch (action.type) {
    case EVM_CHAINS_DATA:
      return {
        ...state,
        [EVM_CHAINS_DATA]: action.value,
      };
    default:
      return state;
  }
};

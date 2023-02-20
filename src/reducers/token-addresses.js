import { TOKEN_ADDRESSES_DATA } from "./types";

export const token_addresses = (
  state = {
    [TOKEN_ADDRESSES_DATA]: null,
  },
  action
) => {
  switch (action.type) {
    case TOKEN_ADDRESSES_DATA:
      return {
        ...state,
        [TOKEN_ADDRESSES_DATA]: action.value
          ? {
              ...state[TOKEN_ADDRESSES_DATA],
              ...action.value,
            }
          : null,
      };
    default:
      return state;
  }
};

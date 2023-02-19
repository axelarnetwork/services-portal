import { TOKEN_LINKERS_DATA } from "./types";

export const token_linkers = (
  state = {
    [TOKEN_LINKERS_DATA]: null,
  },
  action
) => {
  switch (action.type) {
    case TOKEN_LINKERS_DATA:
      return {
        ...state,
        [TOKEN_LINKERS_DATA]: action.value
          ? {
              ...state[TOKEN_LINKERS_DATA],
              ...action.value,
            }
          : null,
      };
    default:
      return state;
  }
};

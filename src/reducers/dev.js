import { SDK } from "./types";

export const dev = (
  state = {
    [SDK]: null,
  },
  action
) => {
  switch (action.type) {
    case SDK:
      return {
        ...state,
        [SDK]: action.value,
      };
    default:
      return state;
  }
};

import { createSlice } from "@reduxjs/toolkit";
import { THEME } from "./types";

export default (
  state = {
    [`${THEME}`]: "light",
  },
  action
) => {
  switch (action.type) {
    case THEME: {
      localStorage.setItem(THEME, action.value);

      return {
        ...state,
        [`${THEME}`]: action.value,
      };
    }
    default:
      return state;
  }
};

export const preferencesSlice = createSlice({
  name: "theme",
  initialState: {
    [`${THEME}`]: "light",
  },
  reducers: {
    setTheme: (state, action) => {
      localStorage.setItem(THEME, action.payload);

      state[`${THEME}`] = action.payload;
    },
  },
});

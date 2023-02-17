import { createSlice } from "@reduxjs/toolkit";
import { THEME } from "./types";

const initialState = {
  [`${THEME}`]: "light",
};

export default (state = initialState, action) => {
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
  name: "preferences",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      localStorage.setItem(THEME, action.payload);

      state[`${THEME}`] = action.payload;
    },
  },
});

export const { setTheme } = preferencesSlice.actions;

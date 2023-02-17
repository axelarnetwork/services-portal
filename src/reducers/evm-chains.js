import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  [`${EVM_CHAINS_DATA}`]: null,
};

import { EVM_CHAINS_DATA } from "./types";

export default (state = initialState, action) => {
  switch (action.type) {
    case EVM_CHAINS_DATA:
      return {
        ...state,
        [`${EVM_CHAINS_DATA}`]: action.value,
      };
    default:
      return state;
  }
};

export const evmChainSlice = createSlice({
  name: "evmChainsData",
  initialState,
  reducers: {
    setEvmChainsData: (state, action) => {
      state[`${EVM_CHAINS_DATA}`] = action.payload;
    },
  },
});

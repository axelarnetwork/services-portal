import { createSlice } from "@reduxjs/toolkit";

import { WALLET_DATA, WALLET_RESET } from "./types";

const INITIAL_STATE = {
  default_chain_id: null,
  chain_id: null,
  provider: null,
  web3_provider: null,
  signer: null,
  address: null,
};

export const wallet = (
  state = {
    [WALLET_DATA]: INITIAL_STATE,
  },
  action
) => {
  switch (action.type) {
    case WALLET_DATA:
      return {
        ...state,
        [WALLET_DATA]: {
          ...state[WALLET_DATA],
          ...action.value,
        },
      };
    case WALLET_RESET:
      return {
        ...state,
        [WALLET_DATA]: INITIAL_STATE,
      };
    default:
      return state;
  }
};

export const walletSlice = createSlice({
  name: "wallet",
  initialState: INITIAL_STATE,
  reducers: {
    setWalletData: (state, action) => {
      state = {
        ...state,
        ...action.payload,
      };
    },
    resetWalletData: (state) => {
      state = INITIAL_STATE;
    },
  },
});

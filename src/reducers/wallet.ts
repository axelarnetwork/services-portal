import {
  JsonRpcSigner,
  Web3Provider,
  Provider,
} from "@ethersproject/providers";
import { createSlice } from "@reduxjs/toolkit";

import { WALLET_DATA, WALLET_RESET } from "./types";

export type WalletData = {
  default_chain_id: number | null;
  chain_id: number | null;
  provider: Provider | null;
  web3_provider: Web3Provider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
};

const INITIAL_STATE = {
  [WALLET_DATA]: {
    default_chain_id: null,
    chain_id: null,
    provider: null,
    web3_provider: null,
    signer: null,
    address: null,
  } as WalletData,
};

export type WalletState = typeof INITIAL_STATE;

type Action =
  | { type: typeof WALLET_DATA; value: typeof INITIAL_STATE }
  | { type: typeof WALLET_RESET };

export const wallet = (state = INITIAL_STATE, action: Action) => {
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

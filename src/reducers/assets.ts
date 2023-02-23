import { ASSETS_DATA } from "./types";

type AxelarScanContract = {
  chain_id: number;
  contract_address: string;
  decimals: number;
  symbol: string;
};

type IBCTokenMeta = {
  chain_id: string;
  decimals: number;
  ibc_denom: string;
};

type AxelarScanAsset = {
  coingecko_id: string;
  decimals: number;
  image: string;
  name: string;
  symbol: string;
  price: number;
  contracts: AxelarScanContract[];
  ibc: IBCTokenMeta[];
};

type AssetsState = {
  [ASSETS_DATA]: AxelarScanAsset[];
};

type Action = {
  type: typeof ASSETS_DATA;
  value: AxelarScanAsset[];
};

const INIIAAL_STATE: AssetsState = {
  [ASSETS_DATA]: [],
};

export const assets = (state = INIIAAL_STATE, action: Action) => {
  switch (action.type) {
    case ASSETS_DATA:
      return {
        ...state,
        [ASSETS_DATA]: action.value,
      };
    default:
      return state;
  }
};

import { combineReducers } from "redux";

import { assets } from "./assets";
import { constant_address_deployer } from "./constant-address-deployer";
import { cosmos_chains } from "./cosmos-chains";
import { dev } from "./dev";
import { ens } from "./ens";
import { evm_chains } from "./evm-chains";
import { gas_service_addresses } from "./gas-service-addresses";
import { gateway_addresses } from "./gateway-addresses";
import { preferences } from "./preferences";
import { rpc_providers } from "./rpc-providers";
import { token_addresses } from "./token-addresses";
import { token_linkers } from "./token-linkers";
import { wallet } from "./wallet";

export default combineReducers({
  preferences,
  evm_chains,
  cosmos_chains,
  assets,
  constant_address_deployer,
  gateway_addresses,
  gas_service_addresses,
  ens,
  rpc_providers,
  dev,
  wallet,
  token_linkers,
  token_addresses,
});

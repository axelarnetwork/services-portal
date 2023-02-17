import { combineReducers } from "redux";

import preferences from "./preferences";
import evm_chains from "./evm-chains";
import cosmos_chains from "./cosmos-chains";
import assets from "./assets";
import constant_address_deployer from "./constant-address-deployer";
import gateway_addresses from "./gateway-addresses";
import gas_service_addresses from "./gas-service-addresses";
import ens from "./ens";
import rpc_providers from "./rpc-providers";
import dev from "./dev";
import wallet from "./wallet";
import chain_id from "./chain-id";
import token_linkers from "./token-linkers";
import token_addresses from "./token-addresses";

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
  chain_id,
  token_linkers,
  token_addresses,
});

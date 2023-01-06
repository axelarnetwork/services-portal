import { combineReducers } from 'redux'

import preferences from './preferences'
import evm_chains from './evm-chains'
import cosmos_chains from './cosmos-chains'
import assets from './assets'
import ens from './ens'
import rpc_providers from './rpc-providers'
import wallet from './wallet'
import chain_id from './chain-id'

export default combineReducers(
  {
    preferences,
    evm_chains,
    cosmos_chains,
    assets,
    ens,
    rpc_providers,
    wallet,
    chain_id,
  },
)
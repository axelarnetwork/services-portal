import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Contract } from 'ethers'

import Copy from '../copy'
import InterchainTokenLinker from '../../lib/contract/json/InterchainTokenLinker.json'
import { getChain } from '../../lib/chain/utils'
import { ellipse } from '../../lib/utils'

export default (
  {
    chain,
    tokenAddress,
  },
) => {
  const {
    evm_chains,
    rpc_providers,
    token_linkers,
  } = useSelector(
    state => (
      {
        evm_chains: state.evm_chains,
        rpc_providers: state.rpc_providers,
        token_linkers: state.token_linkers,
      }
    ),
    shallowEqual,
  )
  const {
    evm_chains_data,
  } = { ...evm_chains }
  const {
    rpcs,
  } = { ...rpc_providers }
  const {
    token_linkers_data,
  } = { ...token_linkers }

  const [tokenId, setTokenId] = useState(null)

  const getTokenLinkerContract = (
    _signer = signer,
    token_linker_address,
  ) =>
    _signer && token_linker_address &&
    new Contract(token_linker_address, InterchainTokenLinker.abi, _signer)

  const getOriginTokenId = async (
    token_linker,
    token_address,
  ) => {
    if (token_linker && token_address) {
      try {
        const token_id = await token_linker.getOriginTokenId(token_address)
        setTokenId(token_id)
      } catch (error) {}
    }
  }

  useEffect(
    () => {
      if (evm_chains_data && rpcs && token_linkers_data && chain && tokenAddress) {
        const chain_data = getChain(chain, evm_chains_data)

        const _chain_id = chain_data?.chain_id

        const {
          token_linker_address,
        } = { ...token_linkers_data[chain] }

        const token_linker_contract = getTokenLinkerContract(rpcs[_chain_id], token_linker_address)

        getOriginTokenId(token_linker_contract, tokenAddress)
      }
    },
    [evm_chains_data, rpcs, token_linkers_data, chain, tokenAddress],
  )

  return (
    tokenId &&
    (
      <div className="space-y-1">
        <div className="text-slate-400 dark:text-slate-500 text-sm">
          Token ID
        </div>
        <div className="border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between space-x-1 py-1.5 pl-1.5 pr-1">
          <span className="sm:h-5 flex items-center text-slate-500 dark:text-slate-200 text-base sm:text-xs xl:text-sm font-medium">
            {ellipse(
              tokenId,
              10,
            )}
          </span>
          <Copy
            value={tokenId}
          />
        </div>
      </div>
    )
  )
}
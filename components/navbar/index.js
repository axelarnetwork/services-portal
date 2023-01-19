import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import _ from 'lodash'
import { providers } from 'ethers'

import Logo from './logo'
import DropdownNavigations from './navigations/dropdown'
import Navigations from './navigations'
import EnsProfile from '../ens-profile'
import Wallet from '../wallet'
import Theme from './theme'
import SubNavbar from './sub-navbar'
import Copy from '../copy'
import { chains as getChains, assets as getAssets } from '../../lib/api/config'
import { assets as getAssetsPrice } from '../../lib/api/assets'
import { getContracts } from '../../lib/api/contracts'
import { equals_ignore_case, ellipse } from '../../lib/utils'
import { EVM_CHAINS_DATA, COSMOS_CHAINS_DATA, ASSETS_DATA, CONSTANT_ADDRESS_DEPLOYER, GATEWAY_ADDRESSES_DATA, GAS_SERVICE_ADDRESSES_DATA, RPCS } from '../../reducers/types'

export default () => {
  const dispatch = useDispatch()
  const {
    evm_chains,
    assets,
    rpc_providers,
    wallet,
  } = useSelector(state =>
    (
      {
        evm_chains: state.evm_chains,
        assets: state.assets,
        rpc_providers: state.rpc_providers,
        wallet: state.wallet,
      }
    ),
    shallowEqual,
  )
  const {
    evm_chains_data,
  } = { ...evm_chains }
  const {
    assets_data,
  } = { ...assets }
  const {
    rpcs,
  } = { ...rpc_providers }
  const {
    wallet_data,
  } = { ...wallet }
  const {
    default_chain_id,
    web3_provider,
    address,
  } = { ...wallet_data }

  const router = useRouter()
  const {
    pathname,
  } = { ...router }

  // chains
  useEffect(
    () => {
      const getData = async () => {
        const {
          evm,
          cosmos,
        } = { ...await getChains() }

        if (evm) {
          dispatch(
            {
              type: EVM_CHAINS_DATA,
              value: evm,
            }
          )
        }

        if (cosmos) {
          dispatch(
            {
              type: COSMOS_CHAINS_DATA,
              value: cosmos,
            }
          )
        }
      }

      getData()
    },
    [],
  )

  // assets
  useEffect(
    () => {
      const getData = async () => {
        const assets_data = await getAssets()

        if (assets_data) {
          // price
          let updated_ids =
            assets_data
              .filter(a =>
                typeof a?.price === 'number'
              )
              .map(a => a.id)

          if (updated_ids.length < assets_data.length) {
            let updated = false

            const denoms =
              assets_data
                .filter(a =>
                  a?.id &&
                  !updated_ids.includes(a.id)
                )
                .map(a => {
                  const {
                    id,
                    contracts,
                  } = { ...a }

                  const chain =
                    _.head(
                      (contracts || [])
                        .map(c => c?.chain)
                    )

                  if (chain) {
                    return {
                      denom: id,
                      chain,
                    }
                  }

                  return id
                })

            if (denoms.length > 0) {
              const response =
                await getAssetsPrice(
                  {
                    denoms,
                  },
                )

              if (Array.isArray(response)) {
                response
                  .forEach(a => {
                    const {
                      denom,
                      price,
                    } = { ...a }

                    const asset_index = assets_data
                      .findIndex(_a =>
                        equals_ignore_case(
                          _a?.id,
                          denom,
                        )
                      )

                    if (asset_index > -1) {
                      const asset_data = assets_data[asset_index]

                      const {
                        id,
                      } = { ...asset_data }

                      asset_data.price =
                        price ||
                        asset_data.price ||
                        0

                      assets_data[asset_index] = asset_data

                      updated_ids =
                        _.uniq(
                          _.concat(
                            updated_ids,
                            id,
                          )
                        )

                      updated = true
                    }
                  })
              }
            }

            if (updated) {
              dispatch(
                {
                  type: ASSETS_DATA,
                  value: _.cloneDeep(assets_data),
                }
              )
            }
          }
        }
      }

      getData()
    },
    [],
  )

  // contracts
  useEffect(
    () => {
      const getData = async () => {
        const {
          constant_address_deployer,
          gateway_contracts,
          gas_service_contracts,
        } = { ...await getContracts() }

        if (constant_address_deployer) {
          dispatch(
            {
              type: CONSTANT_ADDRESS_DEPLOYER,
              value: constant_address_deployer,
            }
          )
        }

        if (gateway_contracts) {
          dispatch(
            {
              type: GATEWAY_ADDRESSES_DATA,
              value:
                Object.entries(gateway_contracts)
                  .map(([k, v]) => {
                    const {
                      address,
                    } = { ...v }

                    return {
                      chain: k,
                      address,
                    }
                  }),
            }
          )
        }

        if (gas_service_contracts) {
          dispatch(
            {
              type: GAS_SERVICE_ADDRESSES_DATA,
              value:
                Object.entries(gas_service_contracts)
                  .map(([k, v]) => {
                    const {
                      address,
                    } = { ...v }

                    return {
                      chain: k,
                      address,
                    }
                  }),
            }
          )
        }
      }

      getData()
    },
    [],
  )

  // rpcs
  useEffect(
    () => {
      const init = async => {
        if (evm_chains_data) {
          const _rpcs = {}

          for (const chain_data of evm_chains_data) {
            const {
              disabled,
              chain_id,
              provider_params,
            } = { ...chain_data }

            if (!disabled) {
              const {
                rpcUrls,
              } = { ..._.head(provider_params) }
   
              const rpc_urls =
                (rpcUrls || [])
                  .filter(url => url)

              const provider =
                rpc_urls.length === 1 ?
                  new providers.StaticJsonRpcProvider(
                    _.head(rpc_urls),
                    chain_id,
                  ) :
                  new providers.FallbackProvider(
                    rpc_urls
                      .map((url, i) => {
                        return {
                          provider:
                            new providers.StaticJsonRpcProvider(
                              url,
                              chain_id,
                            ),
                          priority: i + 1,
                          stallTimeout: 1000,
                        }
                      }),
                    rpc_urls.length / 3,
                  )

              _rpcs[chain_id] = provider
            }
          }

          if (!rpcs) {
            dispatch(
              {
                type: RPCS,
                value: _rpcs,
              }
            )
          }
        }
      }

      init()
    },
    [evm_chains_data, pathname],
  )

  return (
    <>
      <div className="navbar">
        <div className="navbar-inner w-full sm:h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Logo />
            <DropdownNavigations />
          </div>
          <div className="w-full flex items-center justify-center mx-0 sm:mx-4 xl:mx-8">
            <Navigations />
          </div>
          <div className="flex items-center justify-end">
            {
              web3_provider &&
              address &&
              (
                <div className="hidden sm:flex lg:hidden xl:flex flex-col space-y-0.5 ml-2">
                  <EnsProfile
                    address={address}
                    fallback={
                      address &&
                      (
                        <Copy
                          value={address}
                          title={
                            <span className="text-slate-600 dark:text-slate-200 text-sm font-semibold">
                              <span className="xl:hidden">
                                {ellipse(
                                  address,
                                  6,
                                )}
                              </span>
                              <span className="hidden xl:block">
                                {ellipse(
                                  address,
                                  6,
                                )}
                              </span>
                            </span>
                          }
                        />
                      )
                    }
                  />
                </div>
              )
            }
            <div className="ml-2 mr-2 sm:mr-8">
              <Wallet
                mainController={true}
                connectChainId={default_chain_id}
              />
            </div>
            <Theme />
          </div>
        </div>
      </div>
      <SubNavbar />
    </>
  )
}
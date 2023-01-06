import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import _ from 'lodash'
import { providers } from 'ethers'

import Logo from './logo'
import DropdownNavigations from './navigations/dropdown'
import Navigations from './navigations'
import Theme from './theme'
import SubNavbar from './sub-navbar'
import { chains as getChains, assets as getAssets } from '../../lib/api/config'
import { assets as getAssetsPrice } from '../../lib/api/assets'
import { equals_ignore_case } from '../../lib/utils'
import { EVM_CHAINS_DATA, COSMOS_CHAINS_DATA, ASSETS_DATA, RPCS } from '../../reducers/types'

export default () => {
  const dispatch = useDispatch()
  const {
    evm_chains,
    cosmos_chains,
    assets,
    rpc_providers,
  } = useSelector(state =>
    (
      {
        evm_chains: state.evm_chains,
        cosmos_chains: state.cosmos_chains,
        assets: state.assets,
        rpc_providers: state.rpc_providers,
      }
    ),
    shallowEqual,
  )
  const {
    evm_chains_data,
  } = { ...evm_chains }
  const {
    cosmos_chains_data,
  } = { ...cosmos_chains }
  const {
    assets_data,
  } = { ...assets }
  const {
    rpcs,
  } = { ...rpc_providers }

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
                  } = { ...id }

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

                  return a.id
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

  // rpcs
  useEffect(
    () => {
      const init = async => {
        if (
          evm_chains_data &&
          [
            '/',
          ].includes(pathname)
        ) {
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
          <div className="flex items-center justify-center">
            <Navigations />
          </div>
          <div className="flex items-center justify-end">
            <Theme />
          </div>
        </div>
      </div>
      <SubNavbar />
    </>
  )
}
import { useEffect } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { AxelarQueryAPI } from "@axelar-network/axelarjs-sdk";
import { providers } from "ethers";
import _ from "lodash";

import {
  getChainConfigs,
  getAssets,
  getAssetPrices,
} from "~/lib/api/axelarscan";
import { getContracts } from "~/lib/api/contracts";
import { equalsIgnoreCase, toArray, ellipse } from "~/lib/utils";
import {
  EVM_CHAINS_DATA,
  COSMOS_CHAINS_DATA,
  ASSETS_DATA,
  CONSTANT_ADDRESS_DEPLOYER,
  GATEWAY_ADDRESSES_DATA,
  GAS_SERVICE_ADDRESSES_DATA,
  RPCS,
  SDK,
} from "~/reducers/types";

import Copy from "../copy";
import EnsProfile from "../ens-profile";
import Wallet from "../wallet";
import Chains from "./chains";
import Logo from "./logo";
import Navigations from "./navigations";
import DropdownNavigations from "./navigations/dropdown";
import SubNavbar from "./sub-navbar";
import Theme from "./theme";

const Navbar = () => {
  const dispatch = useDispatch();
  const { evm_chains, assets, rpc_providers, wallet } = useSelector(
    (state) => ({
      evm_chains: state.evm_chains,
      assets: state.assets,
      rpc_providers: state.rpc_providers,
      wallet: state.wallet,
    }),
    shallowEqual
  );
  const { evm_chains_data } = { ...evm_chains };
  const { rpcs } = { ...rpc_providers };
  const { wallet_data } = { ...wallet };
  const { default_chain_id, web3_provider, address } = { ...wallet_data };

  // chains
  useEffect(() => {
    const getData = async () => {
      const { evm, cosmos } = { ...(await getChainConfigs()) };

      if (evm) {
        dispatch({
          type: EVM_CHAINS_DATA,
          value: evm,
        });
      }

      if (cosmos) {
        dispatch({
          type: COSMOS_CHAINS_DATA,
          value: cosmos,
        });
      }
    };

    getData();
  }, []);

  // assets
  useEffect(() => {
    const getData = async () => {
      const assets_data = await getAssets();

      if (assets_data) {
        // price
        let updated_ids = assets_data
          .filter((a) => typeof a?.price === "number")
          .map((a) => a.id);

        if (updated_ids.length < assets_data.length) {
          let updated = false;

          const denoms = assets_data
            .filter((a) => a?.id && !updated_ids.includes(a.id))
            .map((a) => {
              const { id, contracts } = { ...a };

              const chain = _.head(toArray(contracts).map((c) => c?.chain));

              if (chain) {
                return {
                  denom: id,
                  chain,
                };
              }

              return id;
            });

          if (denoms.length > 0) {
            const response = await getAssetPrices({ denoms });

            if (Array.isArray(response)) {
              response.forEach((a) => {
                const { denom, price } = { ...a };

                const asset_index = assets_data.findIndex((_a) =>
                  equalsIgnoreCase(_a?.id, denom)
                );

                if (asset_index > -1) {
                  const asset_data = assets_data[asset_index];

                  const { id } = { ...asset_data };

                  asset_data.price = price || asset_data.price || 0;
                  assets_data[asset_index] = asset_data;

                  updated_ids = _.uniq(_.concat(updated_ids, id));
                  updated = true;
                }
              });
            }
          }

          if (updated) {
            dispatch({
              type: ASSETS_DATA,
              value: _.cloneDeep(assets_data),
            });
          }
        }
      }
    };

    getData();
  }, []);

  // contracts
  useEffect(() => {
    const getData = async () => {
      const {
        constant_address_deployer,
        gateway_contracts,
        gas_service_contracts,
      } = { ...(await getContracts()) };

      if (constant_address_deployer) {
        dispatch({
          type: CONSTANT_ADDRESS_DEPLOYER,
          value: constant_address_deployer,
        });
      }

      if (gateway_contracts) {
        dispatch({
          type: GATEWAY_ADDRESSES_DATA,
          value: Object.entries(gateway_contracts).map(([k, v]) => {
            const { address } = { ...v };

            return {
              chain: k,
              address,
            };
          }),
        });
      }

      if (gas_service_contracts) {
        dispatch({
          type: GAS_SERVICE_ADDRESSES_DATA,
          value: Object.entries(gas_service_contracts).map(([k, v]) => {
            const { address } = { ...v };

            return {
              chain: k,
              address,
            };
          }),
        });
      }
    };

    getData();
  }, []);

  // rpcs
  useEffect(() => {
    const init = (async) => {
      if (evm_chains_data) {
        const _rpcs = {};

        for (const chain_data of evm_chains_data) {
          const { disabled, chain_id, provider_params } = { ...chain_data };

          if (!disabled) {
            const { rpcUrls } = { ..._.head(provider_params) };

            const rpc_urls = toArray(rpcUrls);

            const provider =
              rpc_urls.length === 1
                ? new providers.StaticJsonRpcProvider(
                    _.head(rpc_urls),
                    chain_id
                  )
                : new providers.FallbackProvider(
                    rpc_urls.map((url, i) => {
                      return {
                        provider: new providers.StaticJsonRpcProvider(
                          url,
                          chain_id
                        ),
                        priority: i + 1,
                        stallTimeout: 1000,
                      };
                    }),
                    rpc_urls.length / 3
                  );

            _rpcs[chain_id] = provider;
          }
        }

        if (!rpcs) {
          dispatch({
            type: RPCS,
            value: _rpcs,
          });
        }
      }
    };

    init();
  }, [evm_chains_data]);

  // sdk
  useEffect(() => {
    const init = (async) => {
      dispatch({
        type: SDK,
        value: {
          queryAPI: new AxelarQueryAPI({
            environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
          }),
        },
      });
    };

    init();
  }, []);

  return (
    <>
      <div className="navbar">
        <div className="navbar-inner flex w-full items-center justify-between sm:h-20">
          <div className="flex items-center">
            <Logo />
            <DropdownNavigations />
          </div>
          <div className="mx-0 flex w-full items-center justify-center sm:mx-4 xl:mx-8">
            <Navigations />
          </div>
          <div className="flex items-center justify-end">
            {evm_chains_data?.length > 0 && web3_provider && (
              <div className="ml-2">
                <Chains />
              </div>
            )}
            {web3_provider && address && (
              <div className="ml-2 mr-1 hidden min-w-max flex-col space-y-0.5 sm:flex lg:hidden xl:flex">
                <EnsProfile
                  address={address}
                  fallback={
                    address && (
                      <Copy
                        value={address}
                        title={
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                            <span className="xl:hidden">
                              {ellipse(address, 6)}
                            </span>
                            <span className="hidden xl:block">
                              {ellipse(address, 6)}
                            </span>
                          </span>
                        }
                      />
                    )
                  }
                />
              </div>
            )}
            <div className="mx-2 sm:ml-3 sm:mr-6">
              <Wallet mainController={true} connectChainId={default_chain_id} />
            </div>
            <Theme />
          </div>
        </div>
      </div>
      <SubNavbar />
    </>
  );
};

export default Navbar;

import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { providers, utils } from "ethers";
import _ from "lodash";
import { useConnect } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import Web3Modal from "web3modal";

import { getChain } from "~/lib/chain/utils";
import { WALLET_DATA, WALLET_RESET } from "~/reducers/types";
import { getWagmiChains } from "~/lib/providers/WagmiConfigProvider";

const providerOptions = {};

const getNetwork = (chain_id) => {
  return {
    1: "mainnet",
    // 10: "optimism",
    // 420: "optimism-goerli",
    56: "binance",
    137: "matic",
    250: "fantom",
    4002: "fantom-testnet",
    1284: "moonbeam",
    42161: "arbitrum",
    42220: "celo",
    43114: "avalanche-mainnet",
    1313161554: "aurora",
    5: "goerli",
    97: "binance-testnet",
    44787: "celo-alfajores",
    43113: "avalanche-fuji-testnet",
    80001: "mumbai",
    421611: "arbitrum-rinkeby",
  }[chain_id];
};

let web3Modal;

const Wallet = ({
  mainController = false,
  hidden = false,
  disabled = false,
  connectChainId,
  onSwitch,
  children,
  className = "",
  childrenClassName = "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 rounded-lg whitespace-nowrap uppercase text-slate-700 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-100 font-semibold py-1.5 px-2.5",
}) => {
  const dispatch = useDispatch();
  const { preferences, evm_chains, wallet } = useSelector(
    (state) => ({
      preferences: state.preferences,
      evm_chains: state.evm_chains,
      wallet: state.wallet,
    }),
    shallowEqual
  );
  const { theme } = { ...preferences };
  const { evm_chains_data } = { ...evm_chains };
  const { wallet_data } = { ...wallet };
  const { chain_id, provider, web3_provider } = { ...wallet_data };

  const [defaultChainId, setDefaultChainId] = useState(null);

  useEffect(() => {
    if (connectChainId && connectChainId !== defaultChainId) {
      setDefaultChainId(connectChainId);
    }
  }, [connectChainId]);

  useEffect(
    () => {
      if (typeof window !== "undefined") {
        if (web3_provider) {
          dispatch({
            type: WALLET_DATA,
            value: {
              default_chain_id: defaultChainId,
            },
          });
        }

        web3Modal = new Web3Modal({
          network:
            getNetwork(defaultChainId) ||
            (process.env.NEXT_PUBLIC_ENVIRONMENT === "mainnet"
              ? "mainnet"
              : "goerli"),
          cacheProvider: true,
          providerOptions,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultChainId]
  );

  useEffect(() => {
    if (web3Modal?.cachedProvider) {
      connect();
    }
  }, [web3Modal]);

  useEffect(() => {
    const update = async () => {
      if (web3Modal) {
        await web3Modal.updateTheme(theme);
      }
    };

    update();
  }, [theme]);

  const { connect: wagmiConnect } = useConnect();

  const connect = useCallback(async () => {
    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const network = await web3Provider.getNetwork();
    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();

    signer.address = address;

    const { chainId } = { ...network };

    wagmiConnect({
      connector: new MetaMaskConnector({
        chains: getWagmiChains(),
        options: {
          shimDisconnect: false,
          shimChainChangedDisconnect: false,
        },
      }),
    });

    dispatch({
      type: WALLET_DATA,
      value: {
        chain_id: chainId,
        provider,
        web3_provider: web3Provider,
        address,
        signer,
      },
    });
  }, [web3Modal, wagmiConnect]);

  const disconnect = useCallback(
    async (e, is_reestablish) => {
      if (web3Modal && !is_reestablish) {
        await web3Modal.clearCachedProvider();
      }

      if (typeof provider?.disconnect === "function") {
        await provider.disconnect();
      }

      if (!is_reestablish) {
        dispatch({
          type: WALLET_RESET,
        });
      }
    },
    [web3Modal, provider]
  );

  const switchChain = async () => {
    if (connectChainId && connectChainId !== chain_id && provider) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: utils.hexValue(connectChainId) }],
        });
      } catch (error) {
        const { code } = { ...error };

        if (code === 4902) {
          try {
            const { provider_params } = {
              ...getChain(connectChainId, evm_chains_data),
            };

            await provider.request({
              method: "wallet_addEthereumChain",
              params: provider_params,
            });
          } catch (error) {}
        }
      }
    }
  };

  useEffect(() => {
    if (provider?.on) {
      const handleChainChanged = (chainId) => {
        if (chainId) {
          connect();
        } else {
          disconnect();
        }
      };

      const handleAccountsChanged = (accounts) => {
        if (_.head(accounts)) {
          dispatch({
            type: WALLET_DATA,
            value: {
              address: _.head(accounts),
            },
          });
        } else {
          disconnect();
        }
      };

      const handleDisconnect = (e) => {
        const { code } = { ...e };

        disconnect(e, code === 1013);

        if (code === 1013) {
          connect();
        }
      };

      provider.on("chainChanged", handleChainChanged);
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("disconnect", handleDisconnect);

      return () => {
        if (provider.removeListener) {
          provider.removeListener("chainChanged", handleChainChanged);
          provider.removeListener("accountsChanged", handleAccountsChanged);
          provider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [provider, disconnect]);

  return (
    !hidden && (
      <>
        {web3_provider ? (
          !mainController && connectChainId && connectChainId !== chain_id ? (
            <button
              disabled={disabled}
              onClick={() => {
                switchChain();
                if (onSwitch) {
                  onSwitch();
                }
              }}
              className={className}
            >
              {children || (
                <div className={childrenClassName}>Switch Network</div>
              )}
            </button>
          ) : (
            <button
              disabled={disabled}
              onClick={disconnect}
              className={className}
            >
              {children || <div className={childrenClassName}>Disconnect</div>}
            </button>
          )
        ) : (
          <button disabled={disabled} onClick={connect} className={className}>
            {children || (
              <div className={childrenClassName}>Connect Wallet</div>
            )}
          </button>
        )}
      </>
    )
  );
};

export default Wallet;

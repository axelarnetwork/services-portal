import { useState, useEffect } from "react";
import { /*BiMessage, */BiCheck } from "react-icons/bi";
// import { BsFileEarmarkCheckFill } from "react-icons/bs";
// import { IoClose } from "react-icons/io5";
import { Blocks, Oval } from "react-loader-spinner";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { useRouter } from "next/router";
import { predictContractConstant } from "@axelar-network/axelar-gmp-sdk-solidity";
// import ConstAddressDeployer from "@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/deploy/ConstAddressDeployer.sol/ConstAddressDeployer.json";
import ERC20MintableBurnable from "@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/test/ERC20MintableBurnable.sol/ERC20MintableBurnable.json";
// import { Tooltip } from "@material-tailwind/react";
import {
  Contract,
  // ContractFactory,
  VoidSigner,
  constants,
  // utils,
} from "ethers";
import _ from "lodash";

import { getChain/*, switchChain*/ } from "~/lib/chain/utils";
// import IUpgradable from "~/lib/contract/json/IUpgradable.json";
import InterchainTokenLinker from "~/lib/contract/json/InterchainTokenLinker.json";
import InterchainTokenLinkerProxy from "~/lib/contract/json/InterchainTokenLinkerProxy.json";
// import LinkerRouter from "~/lib/contract/json/LinkerRouter.json";
// import LinkerRouterProxy from "~/lib/contract/json/LinkerRouterProxy.json";
import {
  deployContract,
  isContractDeployed,
  // getSaltFromKey,
  getContractAddressByChain,
} from "~/lib/contract/utils";
import { ellipse, toArray, loaderColor, parseError } from "~/lib/utils";
import { TOKEN_LINKERS_DATA, TOKEN_ADDRESSES_DATA } from "~/reducers/types";

import Copy from "../copy";
import Image from "../image";
import Wallet from "../wallet";
import InterchainTokenInputAddress from "./input-token-address";
import RegisterOriginTokenButton from "./register-origin-token-button";

const GAS_LIMIT = 2500000;

export default () => {
  const dispatch = useDispatch()
  const {
    preferences,
    evm_chains,
    // cosmos_chains,
    const_address_deployer,
    gateway_addresses,
    gas_service_addresses,
    rpc_providers,
    dev,
    wallet,
    token_linkers,
    token_addresses,
  } = useSelector(
    state => (
      {
        preferences: state.preferences,
        evm_chains: state.evm_chains,
        // cosmos_chains: state.cosmos_chains,
        const_address_deployer: state.constant_address_deployer,
        gateway_addresses: state.gateway_addresses,
        gas_service_addresses: state.gas_service_addresses,
        rpc_providers: state.rpc_providers,
        dev: state.dev,
        wallet: state.wallet,
        token_linkers: state.token_linkers,
        token_addresses: state.token_addresses,
      }
    ),
    shallowEqual,
  );
  const {
    theme,
  } = { ...preferences };
  const {
    evm_chains_data,
  } = { ...evm_chains };
  // const {
  //   cosmos_chains_data,
  // } = { ...cosmos_chains };
  const {
    constant_address_deployer,
  } = { ...const_address_deployer };
  const {
    gateway_addresses_data,
  } = { ...gateway_addresses };
  const {
    gas_service_addresses_data,
  } = { ...gas_service_addresses };
  const {
    rpcs,
  } = { ...rpc_providers };
  const {
    sdk,
  } = { ...dev };
  const {
    wallet_data,
  } = { ...wallet };
  const {
    token_linkers_data,
  } = { ...token_linkers };
  const {
    token_addresses_data,
  } = { ...token_addresses };
  const {
    chain_id,
    // provider,
    signer,
    address,
  } = { ...wallet_data };

  const router = useRouter();
  const {
    query,
  } = { ...router };
  const {
    chain,
    token_address,
  } = { ...query };

  const [selectedChain, setSelectedChain] = useState(null);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenId, setTokenId] = useState(null);

  // const [tokenLinkerDeployStatus, setTokenLinkerDeployStatus] = useState(null);

  /*** deployment ***/
  const deployToken = async (
    name,
    symbol,
    decimals = 18,
    _signer = signer,
  ) => {
    let response;

    if (_signer && name && symbol) {
      try {
        const contract = await deployContract(ERC20MintableBurnable, _signer, [name, symbol, 18]);

        response = {
          name,
          symbol,
          decimals,
          token_address: contract?.address,
          status: "success",
          message: "Deploy token successful",
        };
      } catch (error) {
        response = {
          ...response,
          status: "failed",
          ...parseError(error),
        };
      }
    }

    return response;
  }

  // const deployUpgradable = async (
  //   key = "deployer",
  //   contract_json,
  //   contract_proxy_json,
  //   args = [],
  //   proxy_args = [],
  //   setup_params = "0x",
  //   _signer = signer,
  //   callback,
  // ) => {
  //   let contract;

  //   if (constant_address_deployer && _signer && key && contract_json && contract_proxy_json) {
  //     const contract_factory = new ContractFactory(contract_json.abi, contract_json.bytecode, _signer);

  //     try {
  //       if (callback) {
  //         callback(
  //           {
  //             status: "pending",
  //             message: "Please confirm",
  //           },
  //         );
  //       }

  //       const _contract = await contract_factory.deploy(...args)

  //       if (callback) {
  //         callback(
  //           {
  //             status: "waiting",
  //             message: "Waiting for confirmation",
  //           },
  //         );
  //       }

  //       await _contract.deployed()

  //       const proxy = await deployAndInitContractConstant(
  //         key,
  //         contract_proxy_json,
  //         proxy_args,
  //         [_contract.address, _signer.address, setup_params],
  //         _signer,
  //         callback ?
  //           response => callback(response) :
  //           undefined,
  //       );

  //       contract = new Contract(proxy.address, contract_json.abi, _signer);
  //     } catch (error) {}
  //   }

  //   return contract;
  // }

  // const upgradeUpgradable = async (
  //   proxy_contract_address,
  //   contract_json,
  //   args = [],
  //   setup_params = "0x",
  //   _signer = signer,
  //   callback,
  // ) => {
  //   let response;

  //   if (_signer && proxy_contract_address && contract_json) {
  //     response = {
  //       ...response,
  //       proxy_contract_address,
  //     };

  //     const proxy = new Contract(proxy_contract_address, IUpgradable.abi, _signer);

  //     const contract_factory = new ContractFactory(contract_json.abi, contract_json.bytecode, _signer);

  //     try {
  //       if (callback) {
  //         callback(
  //           {
  //             status: "pending",
  //             message: "Please confirm",
  //           },
  //         );
  //       }

  //       const contract = await contract_factory.deploy(...args);

  //       if (callback) {
  //         callback(
  //           {
  //             status: "waiting",
  //             message: "Waiting for confirmation",
  //           },
  //         );
  //       }

  //       await contract.deployed();

  //       const contract_address = contract.address;

  //       response = {
  //         ...response,
  //         contract_address,
  //       };

  //       const contract_code = await _signer.provider.getCode(contract_address);

  //       if (callback) {
  //         callback(
  //           {
  //             status: "pending",
  //             message: "Please confirm",
  //           },
  //         );
  //       }

  //       const transaction = await proxy.upgrade(contract_address, utils.keccak256(contract_code), setup_params);

  //       if (callback) {
  //         callback(
  //           {
  //             status: "waiting",
  //             message: "Waiting for confirmation",
  //           },
  //         );
  //       }

  //       const receipt = await transaction.wait();

  //       const {
  //         status,
  //       } = { ...receipt };

  //       const failed = !status;

  //       response = {
  //         ...response,
  //         status: failed ? "failed" : "success",
  //         message: failed ? "Failed to upgrade contract" : "Upgrade contract successful",
  //         receipt,
  //       };
  //     } catch (error) {
  //       response = {
  //         status: "failed",
  //         ...parseError(error),
  //       };
  //     }
  //   }

  //   return response;
  // }

  // const deployAndInitContractConstant = async (
  //   key = "deployer",
  //   contract_json,
  //   args = [],
  //   init_args = [],
  //   _signer = signer,
  //   callback,
  // ) => {
  //   let contract;

  //   if (constant_address_deployer && _signer && key && contract_json) {
  //     const contract_factory = new ContractFactory(contract_json.abi, contract_json.bytecode);

  //     const bytecode = contract_factory.getDeployTransaction(...args)?.data;

  //     const salt = getSaltFromKey(key);

  //     const deployer = new Contract(constant_address_deployer, ConstAddressDeployer.abi, _signer);

  //     const _address = await deployer.deployedAddress(bytecode, address, salt);

  //     contract = new Contract(_address, contract_json.abi, _signer);

  //     const init_data = (await contract.populateTransaction.init(...init_args))?.data;

  //     try {
  //       if (callback) {
  //         callback(
  //           {
  //             status: "pending",
  //             message: "Please confirm",
  //           },
  //         );
  //       }

  //       const transaction = await deployer.connect(_signer).deployAndInit(bytecode, salt, init_data);

  //       if (callback) {
  //         callback(
  //           {
  //             status: "waiting",
  //             message: "Waiting for confirmation",
  //           },
  //         );
  //       }

  //       await transaction.wait();
  //     } catch (error) {
  //       return (
  //         {
  //           status: "failed",
  //           ...parseError(error),
  //         }
  //       );
  //     }
  //   }

  //   return contract;
  // }

  // const _deployTokenLinker = async (
  //   _signer = signer,
  //   callback,
  // ) => {
  //   let response

  //   if (evm_chains_data && constant_address_deployer && gateway_addresses_data && gas_service_addresses_data && _signer) {
  //     const token_linker = await getTokenLinker(_signer);

  //     const {
  //       token_linker_address,
  //       deployed,
  //     } = { ...token_linker };

  //     const {
  //       id,
  //       chain_name,
  //     } = { ...getChain(chain_id, evm_chains_data) };

  //     const chain = chain_name || id;

  //     const gateway_address = getContractAddressByChain(id, gateway_addresses_data);

  //     const gas_service_address = getContractAddressByChain(id, gas_service_addresses_data);

  //     response = {
  //       ...token_linker,
  //       chain,
  //       gateway_address,
  //       gas_service_address,
  //     };

  //     if (token_linker_address && gateway_address && gas_service_address && !deployed) {
  //       let remote_address_validator_address;

  //       try {
  //         remote_address_validator_address = await predictContractConstant(
  //           constant_address_deployer,
  //           _signer,
  //           LinkerRouterProxy,
  //           "remoteAddressValidator",
  //         );
  //       } catch (error) {
  //         response = {
  //           ...response,
  //           status: "failed",
  //           ...parseError(error),
  //         };
  //       }

  //       if (remote_address_validator_address) {
  //         try {
  //           const token_linker_contract = await deployUpgradable(
  //             "tokenLinker",
  //             InterchainTokenLinker,
  //             InterchainTokenLinkerProxy,
  //             [gateway_address, gas_service_address, remote_address_validator_address, chain],
  //             [],
  //             [],
  //             _signer,
  //             callback ?
  //               response => callback(response) :
  //               undefined,
  //           );

  //           const remote_address_validator_contract =
  //             token_linker_contract?.address &&
  //             await deployUpgradable(
  //               "remoteAddressValidator",
  //               LinkerRouter,
  //               LinkerRouterProxy,
  //               [token_linker_contract.address, [], []],
  //               [],
  //               [],
  //               _signer,
  //               callback ?
  //                 response => callback(response) :
  //                 undefined,
  //             );

  //           const failed = !remote_address_validator_contract?.address;

  //           response = {
  //             ...response,
  //             status: failed ? "failed" : "success",
  //             message: failed ? "Failed to deploy contract" : "Deploy contract successful",
  //           };

  //           if (!failed) {
  //             response = {
  //               ...response,
  //               remote_address_validator_address,
  //               deployed: await isContractDeployed(token_linker_address, InterchainTokenLinker, _signer),
  //             };

  //             const {
  //               deployed,
  //             } = { ...response };

  //             if (deployed) {
  //               dispatch(
  //                 {
  //                   type: TOKEN_LINKERS_DATA,
  //                   value: {
  //                     [id]: {
  //                       ...token_linker,
  //                       deployed,
  //                     },
  //                   },
  //                 }
  //               );
  //             }
  //           }
  //         } catch (error) {
  //           response = {
  //             ...response,
  //             status: "failed",
  //             ...parseError(error),
  //           };
  //         }
  //       }
  //     }
  //   }

  //   return response;
  // }

  // const deployTokenLinker = async (
  //   chain,
  //   _signer,
  // ) => {
  //   const chain_data = getChain(chain, evm_chains_data);

  //   if (chain_data?.chain_id !== chain_id && !_signer) {
  //     setTokenLinkerDeployStatus(
  //       {
  //         chain,
  //         status: "switching",
  //         message: "Please switch network"
  //       }
  //     );

  //     const _signer = await switchChain(chain_data?.chain_id, provider, evm_chains_data);

  //     if (_signer) {
  //       deployTokenLinker(chain, _signer);
  //     }
  //     else {
  //       setTokenLinkerDeployStatus(null);
  //     }
  //   }
  //   else {
  //     setTokenLinkerDeployStatus(
  //       {
  //         chain,
  //         status: "pending",
  //         message: "Deploying",
  //       }
  //     );

  //     const response = await _deployTokenLinker(
  //       _signer,
  //       updated_status => {
  //         setTokenLinkerDeployStatus(
  //           {
  //             chain,
  //             ...updated_status,
  //           }
  //         );
  //       },
  //     );

  //     const {
  //       deployed,
  //       status,
  //       message,
  //       code,
  //     } = { ...response };

  //     setTokenLinkerDeployStatus(
  //       deployed ||
  //       [
  //         "user_rejected",
  //       ]
  //       .includes(code) ?
  //         null :
  //         status === "failed" ?
  //           {
  //             ...response,
  //             chain,
  //             error_message: message,
  //             message: "Deployment failed",
  //           } :
  //           response
  //     );
  //   }
  // }
  /*** deployment ***/

  /***** getter *****/
  const getSupportedEvmChains = (
    chains_data = evm_chains_data,
  ) => {
    return (
      toArray(chains_data)
        .filter(c => {
          const {
            id,
            chain_id,
            deprecated,
          } = { ...c };

          return (
            id && chain_id && !deprecated &&
            getContractAddressByChain(id, gateway_addresses_data) &&
            getContractAddressByChain(id, gas_service_addresses_data)
          );
        })
    );
  }

  const getTokenLinker = async (
    _signer = signer,
  ) => {
    let response

    if (constant_address_deployer && _signer) {
      try {
        const token_linker_address =
          process.env.NEXT_PUBLIC_TOKEN_LINKER_ADDRESS ||
          await predictContractConstant(
            constant_address_deployer,
            _signer,
            InterchainTokenLinkerProxy,
            "tokenLinker",
          );

        const deployed = await isContractDeployed(token_linker_address, InterchainTokenLinker, _signer);

        response = {
          constant_address_deployer,
          token_linker_address,
          deployed,
        };
      } catch (error) {
        response = {
          ...response,
          status: "failed",
          ...parseError(error),
        };
      }
    }

    return response;
  }

  const getTokenLinkerContract = (
    _signer = signer,
    token_linker_address,
  ) =>
    _signer && token_linker_address &&
    new Contract(token_linker_address, InterchainTokenLinker.abi, _signer);

  const getTokenAddress = async (
    token_linker,
    token_id,
  ) => {
    let response = { token_id };

    if (signer && token_linker && token_id) {
      try {
        const token_address = await token_linker.getTokenAddress(token_id);

        response = {
          ...response,
          status: "success",
          message: "Get token address successful",
          token_address,
        };
      } catch (error) {
        response = {
          ...response,
          status: "failed",
          ...parseError(error),
        };
      }
    }

    return response;
  }

  const getOriginTokenId = async (
    token_linker,
    token_address,
  ) => {
    let response = { token_address };

    if (signer && token_linker && token_address) {
      try {
        const token_id = await token_linker.getOriginTokenId(token_address);

        response = {
          ...response,
          status: "success",
          message: "Get token id successful",
          token_id,
        };
      } catch (error) {
        response = {
          ...response,
          status: "failed",
          ...parseError(error),
        };
      }
    }

    return response;
  }
  /***** getter *****/

  /***** setter *****/
  // const registerOriginToken = async (
  //   token_linker,
  //   token_address,
  // ) => {
  //   let response = { token_address };

  //   if (signer && token_linker && token_address) {
  //     try {
  //       const transaction = await token_linker.registerOriginToken(token_address);

  //       const receipt = await transaction.wait();

  //       const {
  //         status,
  //       } = { ...receipt };

  //       const failed = !status;

  //       response = {
  //         ...response,
  //         status: failed ? "failed" : "success",
  //         message: failed ? "Failed to register origin token" : "Register origin token successful",
  //         receipt,
  //       };
  //     } catch (error) {
  //       response = {
  //         ...response,
  //         status: "failed",
  //         ...parseError(error),
  //       };
  //     }
  //   }

  //   return response;
  // }

  const deployRemoteTokens = async (
    token_linker,
    token_id,
    chains,
  ) => {
    let response = { token_id, chains };

    if (signer && token_linker && token_id && Array.isArray(chains) && chains.length > 0) {
      try {
        const {
          id,
          provider_params,
        } = { ...getChain(chain_id, evm_chains_data) };

        const {
          nativeCurrency,
        } = { ..._.head(provider_params) };

        const {
          symbol,
        } = { ...nativeCurrency };

        const gas_values = await Promise.all(
          chains
            .map(chain =>
              new Promise(
                async resolve => {
                  resolve(BigInt(await sdk.queryAPI.estimateGasFee(id, chain, symbol, GAS_LIMIT)))
                }
              )
            )
        );

        const transaction = await token_linker.deployRemoteTokens(token_id, chains, gas_values, { value: _.sum(gas_values) });

        const receipt = await transaction.wait();

        const {
          status,
        } = { ...receipt };

        const failed = !status;

        response = {
          ...response,
          status: failed ? "failed" : "success",
          message: failed ? "Failed to deploy remote tokens" : "Started deploying remote tokens",
          receipt,
        };
      } catch (error) {
        response = {
          ...response,
          status: "failed",
          ...parseError(error),
        };
      }
    }

    return response;
  }

  const registerOriginTokenAndDeployRemoteTokens = async (
    token_linker,
    token_address,
    chains,
  ) => {
    let response = { token_address, chains };

    if (signer && token_linker && token_address && Array.isArray(chains)) {
      try {
        const register_only = chains.length === 0;

        let gas_values;

        if (!register_only) {
          const {
            id,
            provider_params,
          } = { ...getChain(chain_id, evm_chains_data) };

          const {
            nativeCurrency,
          } = { ..._.head(provider_params) };

          const {
            symbol,
          } = { ...nativeCurrency };

          gas_values = await Promise.all(
            chains
              .map(chain =>
                new Promise(
                  async resolve => {
                    resolve(BigInt(await sdk.queryAPI.estimateGasFee(id, chain, symbol, GAS_LIMIT)))
                  }
                )
              )
          );
        }

        const transaction = register_only ?
          await token_linker.registerOriginToken(token_address) :
          await token_linker.registerOriginTokenAndDeployRemoteTokens(token_address, chains, gas_values, { value: _.sum(gas_values) });

        const receipt = await transaction.wait();

        const {
          status,
        } = { ...receipt };

        const failed = !status;

        response =  {
          ...response,
          status: failed ? "failed" : "success",
          message: failed ? `Failed to register origin token${register_only ? "" : " and deploy remote tokens"}` : `Registered origin token${register_only ? "" : " and started deploying remote tokens"}`,
          receipt,
        };
      } catch (error) {
        response = {
          ...response,
          status: "failed",
          ...parseError(error),
        };
      }
    }

    return response;
  }
  /***** setter *****/

  // load token linkers of supported chains
  useEffect(
    () => {
      if (evm_chains_data && constant_address_deployer && gateway_addresses_data && gas_service_addresses_data && rpcs) {
        if (signer) {
          getSupportedEvmChains()
            .forEach(async c => {
              const {
                id,
              } = { ...c };

              const _chain_id = c.chain_id;

              const provider = _chain_id === chain_id ? signer : new VoidSigner(address, rpcs[_chain_id]);

              const token_linker = await getTokenLinker(provider);

              if (token_linker) {
                dispatch(
                  {
                    type: TOKEN_LINKERS_DATA,
                    value: {
                      [id]: token_linker,
                    },
                  }
                );
              }
            });
        }
        else {
          dispatch(
            {
              type: TOKEN_LINKERS_DATA,
              value: null,
            }
          )
        }
      }
    },
    [evm_chains_data, constant_address_deployer, gateway_addresses_data, gas_service_addresses_data, rpcs, address],
  )

  // setup chain from url params
  useEffect(
    () => {
      setSelectedChain(chain);
    },
    [chain],
  )

  // setup token address from url params
  useEffect(
    () => {
      setTokenAddress(token_address);
    },
    [token_address],
  )

  // setup token id from chain and token address
  useEffect(
    () => {
      const getTokenId = async () => {
        if (evm_chains_data && rpcs && token_linkers_data?.[selectedChain]) {
          const {
            token_linker_address,
          } = { ...token_linkers_data[selectedChain] };

          if (token_linker_address && tokenAddress) {
            const chain_data = getChain(selectedChain, evm_chains_data);

            const _chain_id = chain_data?.chain_id;

            const token_linker_contract = getTokenLinkerContract(
              _chain_id === chain_id ?  signer : address ? new VoidSigner(address, rpcs[_chain_id]) : rpcs[_chain_id],
              token_linker_address,
            );

            const response = await getOriginTokenId(token_linker_contract, tokenAddress);

            const {
              token_id,
            } = { ...response };

            setTokenId(token_id);
          }
        }
      }

      getTokenId();
    },
    [evm_chains_data, rpcs, token_linkers_data, selectedChain, tokenAddress, address],
  )

  // load token addresses of supported chains
  useEffect(
    () => {
      if (evm_chains_data && rpcs && token_linkers_data) {
        if (tokenId) {
          getSupportedEvmChains()
            .forEach(async c => {
              const {
                id,
              } = { ...c };

              const {
                token_linker_address,
              } = { ...token_linkers_data[id] };

              if (token_linker_address) {
                const chain_data = getChain(id, evm_chains_data);

                const _chain_id = chain_data?.chain_id;

                const token_linker_contract = getTokenLinkerContract(
                  _chain_id === chain_id ? signer : address ? new VoidSigner(address, rpcs[_chain_id]) : rpcs[_chain_id],
                  token_linker_address,
                );

                const response = await getTokenAddress(token_linker_contract, tokenId);

                const {
                  token_address,
                } = { ...response };

                if (token_address) {
                  dispatch(
                    {
                      type: TOKEN_ADDRESSES_DATA,
                      value: {
                        [id]: token_address,
                      },
                    }
                  );
                }
              }
            })
        }
        else {
          dispatch(
            {
              type: TOKEN_ADDRESSES_DATA,
              value: null,
            }
          );
        }
      }
    },
    [evm_chains_data, rpcs, token_linkers_data, tokenId, address],
  )

  const chain_data = getChain(chain_id, getSupportedEvmChains()) || _.head(getSupportedEvmChains());

  return (
    <div
      className="flex justify-center my-4"
      style={
        {
          minHeight: "65vh",
        }
      }
    >
      {!signer ?
        <div className="min-h-full flex flex-col justify-center space-y-3">
          <Wallet />
          <span className="text-slate-400 dark:text-slate-600">
            Please connect your wallet to manage your contract
          </span>
        </div> :
        !token_linkers_data ?
          <div className="w-full">
            <div className="h-full flex items-center justify-center">
              <Blocks />
            </div>
          </div> :
          !token_address ?
            <div className="w-full flex flex-col items-center justify-center space-y-8">
              <InterchainTokenInputAddress />
              <span className="text-base font-medium">
                Or
              </span>
              <RegisterOriginTokenButton
                buttonTitle="Deploy a new ERC-20 token"
                buttonClassName="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 w-full max-w-md rounded-lg text-white text-lg font-semibold py-3 px-4"
                initialChainData={chain_data}
                supportedEvmChains={
                  getSupportedEvmChains()
                    .filter(c =>
                      (!token_linkers_data || token_linkers_data[c.id]?.deployed) &&
                      (!token_addresses_data || !token_addresses_data[c.id] || token_addresses_data[c.id] === constants.AddressZero)
                    )
                }
                tokenLinker={
                  getTokenLinkerContract(
                    chain_data?.chain_id === chain_id ? signer : address ? new VoidSigner(address, rpcs?.[chain_data?.chain_id]) : rpcs?.[chain_data?.chain_id],
                    token_linkers_data[chain_data?.id]?.token_linker_address,
                  )
                }
                deployToken={deployToken}
                registerOriginTokenAndDeployRemoteTokens={registerOriginTokenAndDeployRemoteTokens}
              />
            </div> :
            /*
              <div className="w-full xl:px-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                  {getSupportedEvmChains()
                    .map(c => {
                      const {
                        id,
                      } = { ...c };

                      return {
                        chain: id,
                        chain_data: c,
                        ...token_linkers_data[id],
                      };
                    })
                    .filter(tl => !process.env.NEXT_PUBLIC_TOKEN_LINKER_ADDRESS || tl?.deployed)
                    .map((tl, i) => {
                      const {
                        chain_data,
                        token_linker_address,
                        deployed,
                      } = { ...tl };

                      const {
                        id,
                        name,
                        image,
                        explorer,
                      } = { ...chain_data };

                      const {
                        url,
                        address_path,
                      } = { ...explorer };

                      const _chain_id = chain_data?.chain_id;

                      const address_url =
                        url && address_path && token_linker_address &&
                        `${url}${address_path.replace("{address}", token_linker_address)}`;

                      const must_switch_network = _chain_id && _chain_id !== chain_id;

                      return (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-900 bg-opacity-100 dark:bg-opacity-50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-5 py-5 px-4"
                        >
                          <div className="flex items-center justify-between space-x-2.5">
                            <div className="flex items-center space-x-2.5">
                              <Image
                                src={image}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-lg font-bold">
                                {name}
                              </span>
                            </div>
                            {
                              deployed &&
                              (
                                <RegisterOriginTokenButton
                                  tooltip="Register origin token"
                                  placement="bottom"
                                  initialChainData={chain_data}
                                  supportedEvmChains={
                                    getSupportedEvmChains()
                                      .filter(c =>
                                        (!token_linkers_data || token_linkers_data[c.id]?.deployed) &&
                                        (!token_addresses_data || !token_addresses_data[c.id] || token_addresses_data[c.id] === constants.AddressZero)
                                      )
                                  }
                                  tokenLinker={
                                    getTokenLinkerContract(
                                      _chain_id === chain_id ? signer : address ? new VoidSigner(address, rpcs?.[_chain_id]) : rpcs?.[_chain_id],
                                      token_linker_address,
                                    )
                                  }
                                  deployToken={deployToken}
                                  registerOriginTokenAndDeployRemoteTokens={registerOriginTokenAndDeployRemoteTokens}
                                />
                              )
                            }
                          </div>
                          <div>
                            <div className="h-full flex flex-col justify-between space-y-5">
                              <div className="space-y-1">
                                <div className="text-slate-400 dark:text-slate-500 text-sm">
                                  TokenLinker address
                                </div>
                                <div className="border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between space-x-1 py-1.5 pl-1.5 pr-1">
                                  {address_url ?
                                    <a
                                      href={address_url}
                                      target="_blank"
                                      rel="noopenner noreferrer"
                                      className="sm:h-5 flex items-center text-blue-500 dark:text-blue-200 text-base sm:text-xs xl:text-sm font-semibold"
                                    >
                                      {ellipse(token_linker_address, 10)}
                                    </a> :
                                    <span className="sm:h-5 flex items-center text-slate-500 dark:text-slate-200 text-base sm:text-xs xl:text-sm font-medium">
                                      {ellipse(token_linker_address, 10)}
                                    </span>
                                  }
                                  {
                                    token_linker_address &&
                                    (
                                      <Copy
                                        value={token_linker_address}
                                      />
                                    )
                                  }
                                </div>
                              </div>
                              {deployed ?
                                address_url ?
                                  <a
                                    href={address_url}
                                    target="_blank"
                                    rel="noopenner noreferrer"
                                    className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 dark:bg-opacity-75 w-full rounded flex items-center justify-center text-green-500 dark:text-green-500 space-x-1.5 p-1.5"
                                  >
                                    <BsFileEarmarkCheckFill
                                      size={16}
                                    />
                                    <span className="text-sm font-semibold">
                                      Deployed
                                    </span>
                                  </a> :
                                  <div className="bg-slate-50 dark:bg-slate-900 dark:bg-opacity-75 w-full rounded flex items-center justify-center text-green-500 dark:text-green-500 space-x-1.5 p-1.5">
                                    <BsFileEarmarkCheckFill
                                      size={16}
                                    />
                                    <span className="text-sm font-medium">
                                      Deployed
                                    </span>
                                  </div> :
                                tokenLinkerDeployStatus?.chain === id ?
                                  <div
                                    className={
                                      `${
                                        ["failed"].includes(tokenLinkerDeployStatus.status) ?
                                          "bg-red-500 dark:bg-red-600" :
                                          "bg-blue-500 dark:bg-blue-600"
                                      } w-full ${
                                        ["switching", "pending", "waiting"].includes(tokenLinkerDeployStatus.status) ?
                                          "cursor-wait" :
                                          "cursor-default"
                                      } rounded flex items-center justify-center text-white font-medium p-1.5`
                                    }
                                  >
                                    {
                                      ["switching", "pending", "waiting"].includes(tokenLinkerDeployStatus.status) &&
                                      (
                                        <div className="mr-1.5">
                                          <Oval
                                            width={14}
                                            height={14}
                                            color="white"
                                          />
                                        </div>
                                      )
                                    }
                                    <span className={`text-sm ${["failed"].includes(tokenLinkerDeployStatus.status) ? "ml-1 mr-0.5" : ""}`}>
                                      {tokenLinkerDeployStatus.message}
                                    </span>
                                    {
                                      ["failed"].includes(tokenLinkerDeployStatus.status) &&
                                      (
                                        <div className="flex items-center space-x-1 ml-auto">
                                          {
                                            tokenLinkerDeployStatus.error_message &&
                                            (
                                              <Tooltip
                                                placement="top"
                                                content={tokenLinkerDeployStatus.error_message}
                                                className="z-50 bg-black text-white text-xs"
                                              >
                                                <div>
                                                  <BiMessage
                                                    size={14}
                                                  />
                                                </div>
                                              </Tooltip>
                                            )
                                          }
                                          <button
                                            onClick={() => setTokenLinkerDeployStatus(null)}
                                            className="hover:bg-red-400 dark:hover:bg-red-500 rounded-full p-0.5"
                                          >
                                            <IoClose
                                              size={12}
                                            />
                                          </button>
                                        </div>
                                      )
                                    }
                                  </div> :
                                  !token_linker_address ?
                                    <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50 w-full cursor-wait rounded flex items-center justify-center text-blue-500 dark:text-blue-600 font-medium p-1.5">
                                      <div className="mr-1.5">
                                        <Oval
                                          width={14}
                                          height={14}
                                          color={loaderColor(theme)}
                                        />
                                      </div>
                                      <span>
                                        Loading
                                      </span>
                                    </div> :
                                    must_switch_network ?
                                      <Wallet
                                        connectChainId={_chain_id}
                                        className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 w-full cursor-pointer rounded flex items-center justify-center text-white font-medium hover:font-semibold space-x-1.5 p-1.5"
                                      >
                                        <span className="text-sm">
                                          Switch network to deploy
                                        </span>
                                      </Wallet> :
                                      <button
                                        disabled={tokenLinkerDeployStatus && tokenLinkerDeployStatus.status !== "failed"}
                                        onClick={() => deployTokenLinker(id)}
                                        className={
                                          `bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 w-full ${
                                            tokenLinkerDeployStatus?.chain && tokenLinkerDeployStatus.chain !== id && tokenLinkerDeployStatus.status !== "failed" ?
                                              "cursor-not-allowed" :
                                              "cursor-pointer"
                                          } rounded flex items-center justify-center text-white font-medium hover:font-semibold space-x-1.5 p-1.5`
                                        }
                                      >
                                        <span className="text-sm">
                                          Deploy
                                        </span>
                                      </button>
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            */
            <div className="w-full xl:px-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {getSupportedEvmChains()
                  .map(c => {
                    const {
                      id,
                    } = { ...c };

                    return {
                      chain: id,
                      chain_data: c,
                      ...token_linkers_data[id],
                    };
                  })
                  .filter(tl => tl.deployed)
                  .map((tl, i) => {
                    const {
                      chain_data,
                      token_linker_address,
                    } = { ...tl };

                    const {
                      id,
                      chain_name,
                      name,
                      image,
                      explorer,
                    } = { ...chain_data };

                    const {
                      url,
                      address_path,
                    } = { ...explorer };

                    const _chain_data = getChain(chain, evm_chains_data);

                    const _id = _chain_data?.id;
                    const _chain_id = _chain_data?.chain_id;

                    const is_origin = id === _id;

                    const _tokenAddress = is_origin ? tokenAddress : token_addresses_data?.[id];

                    const registered = token_addresses_data?.[chain] && token_addresses_data[chain] !== constants.AddressZero;

                    const registered_or_deployed_remote = token_addresses_data?.[id] && token_addresses_data[id] !== constants.AddressZero;

                    const address_url =
                      url && address_path && (is_origin || registered_or_deployed_remote) &&
                      `${url}${address_path.replace("{address}", _tokenAddress)}`;

                    return (
                      <div
                        key={i}
                        className="bg-white dark:bg-slate-900 bg-opacity-100 dark:bg-opacity-50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-5 py-5 px-4"
                      >
                        <div className="flex items-center justify-between space-x-2.5">
                          <div className="flex items-center space-x-2.5">
                            <Image
                              src={image}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="text-lg font-bold">
                              {name}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="h-full flex flex-col justify-between space-y-5">
                            <div className="space-y-1">
                              <div className="text-slate-400 dark:text-slate-500 text-sm">
                                {is_origin || registered_or_deployed_remote ? "Token address" : "Status"}
                              </div>
                              <div className="border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between space-x-1 py-1.5 pl-1.5 pr-1">
                                {address_url ?
                                  <a
                                    href={address_url}
                                    target="_blank"
                                    rel="noopenner noreferrer"
                                    className="sm:h-5 flex items-center text-blue-500 dark:text-blue-200 text-base sm:text-xs xl:text-sm font-semibold"
                                  >
                                    {ellipse(_tokenAddress, 10)}
                                  </a> :
                                  is_origin || registered_or_deployed_remote ?
                                    <span className="sm:h-5 flex items-center text-slate-500 dark:text-slate-200 text-base sm:text-xs xl:text-sm font-medium">
                                      {ellipse(_tokenAddress, 10)}
                                    </span> :
                                    <span className="sm:h-5 flex items-center text-slate-400 dark:text-slate-500 text-base sm:text-xs xl:text-sm font-medium">
                                      Remote token not deployed
                                    </span>
                                }
                                {
                                  (is_origin || registered_or_deployed_remote) && _tokenAddress &&
                                  (
                                    <Copy
                                      value={_tokenAddress}
                                    />
                                  )
                                }
                              </div>
                            </div>
                            {registered_or_deployed_remote ?
                              address_url ?
                                <a
                                  href={address_url}
                                  target="_blank"
                                  rel="noopenner noreferrer"
                                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 dark:bg-opacity-75 w-full rounded flex items-center justify-center text-green-500 dark:text-green-500 space-x-1.5 p-1.5"
                                >
                                  <BiCheck
                                    size={16}
                                  />
                                  <span className="text-sm font-semibold">
                                    {is_origin ? "Registered" : "Deployed"}
                                  </span>
                                </a> :
                                <div className="bg-slate-50 dark:bg-slate-900 dark:bg-opacity-75 w-full rounded flex items-center justify-center text-green-500 dark:text-green-500 space-x-1.5 p-1.5">
                                  <BiCheck
                                    size={16}
                                  />
                                  <span className="text-sm font-medium">
                                    {is_origin ? "Registered" : "Deployed"}
                                  </span>
                                </div> :
                              !token_linker_address || (!token_addresses_data || (tokenId && !token_addresses_data[id])) ?
                                <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50 w-full cursor-wait rounded flex items-center justify-center text-blue-500 dark:text-blue-600 font-medium p-1.5">
                                  <div className="mr-1.5">
                                    <Oval
                                      width={14}
                                      height={14}
                                      color={loaderColor(theme)}
                                    />
                                  </div>
                                  <span>
                                    Loading
                                  </span>
                                </div> :
                                !registered && !is_origin ?
                                  <div className="bg-slate-50 dark:bg-slate-900 dark:bg-opacity-75 w-full cursor-not-allowed rounded flex items-center justify-center text-slate-400 dark:text-slate-500 space-x-1.5 p-1.5">
                                    <span className="text-sm font-medium">
                                      Origin token not registered
                                    </span>
                                  </div> :
                                  <RegisterOriginTokenButton
                                    buttonTitle={is_origin ? "Register origin token" : "Deploy remote tokens"}
                                    buttonClassName="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 w-full cursor-pointer rounded flex items-center justify-center text-white font-medium hover:font-semibold space-x-1.5 p-1.5"
                                    initialChainData={_chain_data}
                                    supportedEvmChains={
                                      getSupportedEvmChains()
                                        .filter(c =>
                                          token_linkers_data[c.id]?.deployed &&
                                          token_addresses_data?.[c.id] === constants.AddressZero
                                        )
                                    }
                                    isOrigin={is_origin}
                                    fixedTokenAddress={tokenAddress}
                                    initialRemoteChains={is_origin ? undefined : toArray(chain_name)}
                                    tokenId={tokenId}
                                    tokenLinker={
                                      getTokenLinkerContract(
                                        _chain_id === chain_id ? signer : address ? new VoidSigner(address, rpcs?.[_chain_id]) : rpcs?.[_chain_id],
                                        token_linker_address,
                                      )
                                    }
                                    deployRemoteTokens={deployRemoteTokens}
                                    registerOriginTokenAndDeployRemoteTokens={registerOriginTokenAndDeployRemoteTokens}
                                  />
                            }
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
      }
    </div>
  );
}
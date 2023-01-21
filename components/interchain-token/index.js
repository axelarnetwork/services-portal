import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import _ from 'lodash'
import moment from 'moment'
import { Contract, ContractFactory, VoidSigner, utils } from 'ethers'
import { predictContractConstant, deployUpgradable } from '@axelar-network/axelar-gmp-sdk-solidity'
import ERC20MintableBurnable from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/test/ERC20MintableBurnable.sol/ERC20MintableBurnable.json'
import UpgradableProxy from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/upgradables/Proxy.sol/Proxy.json'
import ConstAddressDeployer from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/ConstAddressDeployer.sol/ConstAddressDeployer.json'
import { Blocks, Oval } from 'react-loader-spinner'
import { Tooltip } from '@material-tailwind/react'
import { BsFileEarmarkCheckFill } from 'react-icons/bs'
import { BiMessage } from 'react-icons/bi'
import { IoClose } from 'react-icons/io5'

import Image from '../image'
import Copy from '../copy'
import Wallet from '../wallet'
import { get_chain, switch_chain } from '../../lib/chain/utils'
import { deploy_contract, is_contract_deployed, get_salt_from_key, get_contract_address_by_chain } from '../../lib/contract/utils'
import Deployer from '../../lib/contract/json/Deployer.json'
import RemoteAddressValidator from '../../lib/contract/json/RemoteAddressValidator.json'
import TokenLinker from '../../lib/contract/json/TokenLinker.json'
import ITokenLinker from '../../lib/contract/json/ITokenLinker.json'
import { ellipse, parse_error } from '../../lib/utils'
import { TOKEN_LINKERS_DATA, TOKEN_ADDRESSES_DATA } from '../../reducers/types'

export default () => {
  const dispatch = useDispatch()
  const {
    preferences,
    evm_chains,
    cosmos_chains,
    assets,
    const_address_deployer,
    gateway_addresses,
    gas_service_addresses,
    rpc_providers,
    wallet,
    token_linkers,
    token_addresses,
  } = useSelector(state =>
    (
      {
        preferences: state.preferences,
        evm_chains: state.evm_chains,
        cosmos_chains: state.cosmos_chains,
        assets: state.assets,
        const_address_deployer: state.constant_address_deployer,
        gateway_addresses: state.gateway_addresses,
        gas_service_addresses: state.gas_service_addresses,
        rpc_providers: state.rpc_providers,
        wallet: state.wallet,
        token_linkers: state.token_linkers,
        token_addresses: state.token_addresses,
      }
    ),
    shallowEqual,
  )
  const {
    theme,
  } = { ...preferences }
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
    constant_address_deployer,
  } = { ...const_address_deployer }
  const {
    gateway_addresses_data,
  } = { ...gateway_addresses }
  const {
    gas_service_addresses_data,
  } = { ...gas_service_addresses }
  const {
    rpcs,
  } = { ...rpc_providers }
  const {
    wallet_data,
  } = { ...wallet }
  const {
    token_linkers_data,
  } = { ...token_linkers }
  const {
    token_addresses_data,
  } = { ...token_addresses }
  const {
    chain_id,
    provider,
    web3_provider,
    address,
    signer,
  } = { ...wallet_data }

  const router = useRouter()
  const {
    query,
  } = { ...router }
  const {
    chain,
    token_address,
  } = { ...query }

  const [selectedChain, setSelectedChain] = useState(null)
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenId, setTokenId] = useState(null)

  const [tokenLinkerDeployStatus, setTokenLinkerDeployStatus] = useState(null)



  /*** deployment ***/
  const deployToken = async (
    name,
    symbol,
    decimals = 18,
    _signer = signer,
  ) => {
    let response

    if (
      _signer &&
      name &&
      symbol
    ) {
      try {
        const contract =
          await deploy_contract(
            ERC20MintableBurnable,
            _signer,
            [
              name,
              symbol,
              18,
            ],
          )

        response =
          {
            name,
            symbol,
            decimals,
            token_address: contract?.address,
          }
      } catch (error) {
        response =
          {
            ...response,
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }

  const deployAndInitContractConstant = async (
    key = 'deployer',
    args = [],
    init_args = [],
    _signer = signer,
    callback,
  ) => {
    let contract

    if (
      constant_address_deployer &&
      _signer &&
      key
    ) {
      const contract_factory =
        new ContractFactory(
          Deployer.abi,
          Deployer.bytecode,
        )

      const bytecode =
        contract_factory
          .getDeployTransaction(
            ...args,
          )?.data

      const salt = get_salt_from_key(key)

      const deployer =
        new Contract(
          constant_address_deployer,
          ConstAddressDeployer.abi,
          _signer,
        )

      const _address =
        await deployer
          .deployedAddress(
            bytecode,
            address,
            salt,
          )

      contract =
        new Contract(
          _address,
          Deployer.abi,
          _signer,
        )

      const init_data =
        (
          await contract.populateTransaction
            .init(
              ...init_args,
            )
        )?.data

      try {
        const transaction =
          await deployer
            .connect(_signer)
            .deployAndInit(
              bytecode,
              salt,
              init_data,
            )

        if (callback) {
          callback(
            {
              status: 'waiting',
              message: 'Waiting for confirmation',
            },
          )
        }

        await transaction.wait()
      } catch (error) {}
    }

    return contract
  }

  const _deployTokenLinker = async (
    _signer = signer,
    callback,
  ) => {
    let response

    if (
      evm_chains_data &&
      constant_address_deployer &&
      gateway_addresses_data &&
      gas_service_addresses_data &&
      _signer
    ) {
      const token_linker =
        await getTokenLinker(
          _signer,
        )

      const {
        deployer_address,
        token_linker_address,
        deployed,
      } = { ...token_linker }

      const {
        id,
        chain_name,
      } = {
        ...(
          get_chain(
            chain_id,
            evm_chains_data,
          )
        ),
      }

      const chain =
        chain_name ||
        id

      const gateway_address =
        get_contract_address_by_chain(
          id,
          gateway_addresses_data,
        )

      const gas_service_address =
        get_contract_address_by_chain(
          id,
          gas_service_addresses_data,
        )

      response =
        {
          ...token_linker,
          chain,
          gateway_address,
          gas_service_address,
        }

      if (
        deployer_address &&
        token_linker_address &&
        gateway_address &&
        gas_service_address &&
        !deployed
      ) {
        let remote_address_validator_address

        try {
          if (callback) {
            callback(
              {
                status: 'pending',
                message: 'Please confirm',
              },
            )
          }

          const remote_address_validator =
            await deployUpgradable(
              constant_address_deployer,
              _signer,
              RemoteAddressValidator,
              UpgradableProxy,
              [
                token_linker_address,
                [],
                [],
              ],
              [],
              [],
              'remoteAddressValidator',
            )

          if (remote_address_validator) {
            remote_address_validator_address = remote_address_validator.address
          }
        } catch (error) {
          response =
            {
              ...response,
              status: 'failed',
              ...parse_error(error),
            }
        }

        if (remote_address_validator_address) {
          try {
            const contract_factory =
              new ContractFactory(
                TokenLinker.abi,
                TokenLinker.bytecode,
              )

            const bytecode =
              contract_factory
                .getDeployTransaction(
                  gateway_address,
                  gas_service_address,
                  remote_address_validator_address,
                  chain,
                )?.data

            await deployAndInitContractConstant(
              'deployer',
              [],
              [
                bytecode,
              ],
              _signer,
              callback ?
                updated_status => {
                  callback(
                    updated_status,
                  )
                } :
                undefined,
            )

            response =
              {
                ...response,
                remote_address_validator_address,
                deployed:
                  await is_contract_deployed(
                    token_linker_address,
                    TokenLinker,
                    _signer,
                  ),
              }

            const {
              deployed,
            } = { ...response }

            if (deployed) {
              dispatch(
                {
                  type: TOKEN_LINKERS_DATA,
                  value:
                    {
                      [id]:
                        {
                          ...token_linker,
                          deployed,
                        },
                    },
                }
              )
            }
          } catch (error) {
            response =
              {
                ...response,
                status: 'failed',
                ...parse_error(error),
              }
          }
        }
      }
    }

    return response
  }

  const deployTokenLinker = async (
    chain,
    _signer,
  ) => {
    const chain_data =
      get_chain(
        chain,
        evm_chains_data,
      )

    if (
      chain_data?.chain_id !== chain_id &&
      !_signer
    ) {
      setTokenLinkerDeployStatus(
        {
          chain,
          status: 'switching',
          message: 'Please switch network'
        }
      )

      const _signer =
        await switch_chain(
          chain_data?.chain_id,
          provider,
          evm_chains_data,
        )

      if (_signer) {
        deployTokenLinker(
          chain,
          _signer,
        )
      }
      else {
        setTokenLinkerDeployStatus(null)
      }
    }
    else {
      setTokenLinkerDeployStatus(
        {
          chain,
          status: 'pending',
          message: 'Deploying',
        }
      )

      const response =
        await _deployTokenLinker(
          _signer,
          updated_status => {
            setTokenLinkerDeployStatus(
              {
                chain,
                ...updated_status,
              }
            )
          },
        )

      const {
        deployed,
        status,
        message,
        code,
      } = { ...response }

      setTokenLinkerDeployStatus(
        deployed ||
        [
          'user_rejected',
        ]
        .includes(
          code
        ) ?
          null :
          status === 'failed' ?
            {
              ...response,
              chain,
              error_message: message,
              message: 'Deployment failed',
            } :
            response
      )
    }
  }
  /*** deployment ***/



  /***** getter *****/
  const getSupportedEvmChains = (
    chains_data = evm_chains_data,
  ) => {
    return (
      (chains_data || [])
        .filter(c => {
          const {
            id,
            chain_id,
            deprecated,
          } = { ...c }

          return (
            id &&
            chain_id &&
            !deprecated &&
            get_contract_address_by_chain(
              id,
              gateway_addresses_data,
            ) &&
            get_contract_address_by_chain(
              id,
              gas_service_addresses_data,
            )
          )
        })
    )
  }

  const getTokenLinker = async (
    _signer = signer,
    nonce = 1,
  ) => {
    let response

    if (
      constant_address_deployer &&
      _signer
    ) {
      try {
        const deployer_address =
          await predictContractConstant(
            constant_address_deployer,
            _signer,
            Deployer,
            'deployer',
          )

        const token_linker_address =
          utils.getContractAddress(
            {
              from: deployer_address,
              nonce,
            },
          )

        const deployed =
          await is_contract_deployed(
            token_linker_address,
            TokenLinker,
            _signer,
          )

        response =
          {
            constant_address_deployer,
            deployer_address,
            token_linker_address,
            deployed,
          }
      } catch (error) {
        response =
          {
            ...response,
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }

  const getTokenLinkerContract = (
    _signer = signer,
    token_linker_address,
  ) =>
    _signer &&
    token_linker_address &&
    new Contract(
      token_linker_address,
      ITokenLinker.abi,
      _signer,
    )

  const getTokenAddress = async (
    token_linker,
    token_id,
  ) => {
    let response =
      {
        token_id,
      }

    if (
      signer &&
      token_linker &&
      token_id
    ) {
      try {
        const token_address =
          await token_linker
            .getTokenAddress(
              token_id,
            )

        response =
          {
            ...response,
            status: 'success',
            message: 'Get token address successful',
            token_address,
          }
      } catch (error) {
        response =
          {
            ...response,
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }

  const getNativeTokenId = async (
    token_linker,
    token_address,
  ) => {
    let response =
      {
        token_address,
      }

    if (
      signer &&
      token_linker &&
      token_address
    ) {
      try {
        const token_id =
          await token_linker
            .getNativeTokenId(
              token_address,
            )

        response =
          {
            ...response,
            status: 'success',
            message: 'Get token id successful',
            token_id,
          }
      } catch (error) {
        response =
          {
            ...response,
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }
  /***** getter *****/



  /***** setter *****/
  const registerToken = async (
    token_linker,
    token_address,
  ) => {
    let response =
      {
        token_address,
      }

    if (
      signer &&
      token_linker &&
      token_address
    ) {
      try {
        const transaction =
          await token_linker
            .registerToken(
              token_address,
            )

        const receipt =
          await transaction
            .wait()

        response =
          {
            ...response,
            status: 'success',
            message: 'Register token successful',
            receipt,
          }
      } catch (error) {
        response =
          {
            ...response,
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }

  const deployRemoteTokens = async (
    token_linker,
    token_id,
    chains,
  ) => {
    let response =
      {
        token_id,
        chains,
      }

    if (
      signer &&
      token_linker &&
      token_id &&
      Array.isArray(chains) &&
      chains.length > 0
    ) {
      try {
        const transaction =
          await token_linker
            .deployRemoteTokens(
              token_id,
              chains,
            )

        const receipt =
          await transaction
            .wait()

        response =
          {
            ...response,
            status: 'success',
            message: 'Deploy remote tokens successful',
            receipt,
          }
      } catch (error) {
        response =
          {
            ...response,
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }

  const registerTokenAndDeployRemoteTokens = async (
    token_linker,
    token_address,
    chains,
  ) => {
    let response =
      {
        token_address,
        chains,
      }

    if (
      signer &&
      token_linker &&
      token_address &&
      Array.isArray(chains) &&
      chains.length > 0
    ) {
      try {
        const transaction =
          await token_linker
            .registerTokenAndDeployRemoteTokens(
              token_address,
              chains,
            )

        const receipt =
          await transaction
            .wait()

        response =
          {
            ...response,
            status: 'success',
            message: 'Register token and deploy remote tokens successful',
            receipt,
          }
      } catch (error) {
        response =
          {
            ...response,
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }
  /***** setter *****/



  // load token linkers of supported chains
  useEffect(
    () => {
      if (
        evm_chains_data &&
        constant_address_deployer &&
        gateway_addresses_data &&
        gas_service_addresses_data &&
        rpcs
      ) {
        if (signer) {
          getSupportedEvmChains()
            .forEach(async c => {
              const {
                id,
              } = { ...c }

              const token_linker =
                await getTokenLinker(
                  c.chain_id === chain_id ?
                    signer :
                    new VoidSigner(
                      address,
                      rpcs[c.chain_id],
                    ),
                )

              if (token_linker) {
                dispatch(
                  {
                    type: TOKEN_LINKERS_DATA,
                    value:
                      {
                        [id]: token_linker,
                      },
                  }
                )
              }
            })
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
      setSelectedChain(chain)
    },
    [chain],
  )

  // setup token address from url params
  useEffect(
    () => {
      setTokenAddress(address)
    },
    [address],
  )

  // setup token id from chain and token address
  useEffect(
    () => {
      const getTokenId = async () => {
        if (
          evm_chains_data &&
          rpcs
        ) {
          setTokenId(null)

          const {
            token_linker_address,
          } = { ...token_linkers_data?.[selectedChain] }

          if (
            token_linker_address &&
            tokenAddress
          ) {
            const chain_data =
              get_chain(
                selectedChain,
                evm_chains_data,
              )

            const _chain_id = chain_data?.chain_id

            const token_linker =
              getTokenLinkerContract(
                _chain_id === chain_id ?
                  signer :
                  address ?
                    new VoidSigner(
                      address,
                      rpcs[_chain_id],
                    ) :
                    rpcs[_chain_id],
                token_linker_address,
              )

            const response =
              await getNativeTokenId(
                token_linker,
                tokenAddress,
              )

            const {
              token_id,
            } = { ...response }

            setTokenId(token_id)
          }
        }
      }

      getTokenId()
    },
    [evm_chains_data, rpcs, token_linkers_data, selectedChain, tokenAddress, address],
  )

  // load token addresses of supported chains
  useEffect(
    () => {
      if (evm_chains_data) {
        if (
          token_linkers_data &&
          tokenId
        ) {
          getSupportedEvmChains()
            .forEach(async c => {
              const {
                id,
              } = { ...c }

              const token_linker = token_linkers_data[id]

              if (token_linker) {
                const response =
                  await getTokenAddress(
                    token_linker,
                    tokenId,
                  )

                const {
                  token_address,
                } = { ...response }

                if (token_address) {
                  dispatch(
                    {
                      type: TOKEN_ADDRESSES_DATA,
                      value:
                        {
                          [id]: token_address,
                        },
                    }
                  )
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
          )
        }
      }
    },
    [evm_chains_data, token_linkers_data, tokenId, address],
  )

  return (
    <div
      className="flex justify-center my-4"
      style={
        {
          minHeight: '65vh',
        }
      }
    >
      {
        !signer ?
          <div className="min-h-full flex flex-col justify-center space-y-3">
            <Wallet />
            <span className="text-slate-400 dark:text-slate-600">
              Please connect your wallet to manage your contract
            </span>
          </div> :
          !token_address ?
            <div className="w-full space-y-3 xl:px-1">
              {
                !token_linkers_data ?
                  <div className="h-full flex items-center justify-center">
                    <Blocks />
                  </div> :
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                    {
                      _.orderBy(
                        Object.entries(token_linkers_data)
                          .map(([k, v]) => {
                            const index =
                              evm_chains_data
                                .findIndex(c =>
                                  c?.id === k
                                )

                            return {
                              chain: k,
                              index:
                                index < 0 ?
                                  Number.MAX_VALUE :
                                  index,
                              chain_data: evm_chains_data[index],
                              ...v,
                            }
                          }),
                        [
                          'index',
                        ],
                        [
                          'asc',
                        ],
                      )
                      .map((tl, i) => {
                        const {
                          chain_data,
                          token_linker_address,
                          deployed,
                        } = { ...tl }
                        const {
                          id,
                          name,
                          image,
                          explorer,
                        } = { ...chain_data }
                        const {
                          url,
                          address_path,
                        } = { ...explorer }

                        const address_url =
                          url &&
                          address_path &&
                          `${url}${
                            address_path
                              .replace(
                                '{address}',
                                token_linker_address,
                              )
                          }`

                        return (
                          <div
                            key={i}
                            className="bg-white dark:bg-slate-900 bg-opacity-100 dark:bg-opacity-50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-5 py-5 px-4"
                          >
                            <div className="flex items-center space-x-2.5">
                              <Image
                                src={image}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                              <span className="text-lg font-bold">
                                {name}
                              </span>
                            </div>
                            <div>
                              <div className="h-full flex flex-col justify-between space-y-5">
                                <div className="space-y-1">
                                  <div className="text-slate-400 dark:text-slate-500 text-sm">
                                    TokenLinker address
                                  </div>
                                  <div className="border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between space-x-1 py-1.5 px-1.5 pr-1">
                                    {
                                      address_url ?
                                        <a
                                          href={address_url}
                                          target="_blank"
                                          rel="noopenner noreferrer"
                                          className="text-blue-500 dark:text-blue-200 text-base sm:text-xs xl:text-sm font-semibold"
                                        >
                                          {ellipse(
                                            token_linker_address,
                                            10,
                                          )}
                                        </a> :
                                        <span className="text-slate-500 dark:text-slate-200 text-base sm:text-xs xl:text-sm font-medium">
                                          {ellipse(
                                            token_linker_address,
                                            10,
                                          )}
                                        </span>
                                    }
                                    <Copy
                                      value={token_linker_address}
                                    />
                                  </div>
                                </div>
                                {
                                  deployed ?
                                    address_url ?
                                      <a
                                        href={address_url}
                                        target="_blank"
                                        rel="noopenner noreferrer"
                                        className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 dark:bg-opacity-75 w-full rounded flex items-center justify-center text-green-500 dark:text-green-400 space-x-1.5 p-1.5"
                                      >
                                        <BsFileEarmarkCheckFill
                                          size={16}
                                        />
                                        <span className="uppercase text-sm font-semibold">
                                          Deployed
                                        </span>
                                      </a> :
                                      <div className="bg-slate-50 dark:bg-slate-900 dark:bg-opacity-75 w-full rounded flex items-center justify-center text-green-500 dark:text-green-400 space-x-1.5 p-1.5">
                                        <BsFileEarmarkCheckFill
                                          size={16}
                                        />
                                        <span className="uppercase text-sm font-medium">
                                          Deployed
                                        </span>
                                      </div> :
                                    tokenLinkerDeployStatus?.chain === id ?
                                      <div
                                        className={
                                          `${
                                            [
                                              'failed',
                                            ]
                                            .includes(
                                              tokenLinkerDeployStatus.status
                                            ) ?
                                              'bg-red-500 dark:bg-red-600' :
                                              'bg-blue-500 dark:bg-blue-600'
                                          } w-full ${
                                            [
                                              'switching',
                                              'pending',
                                              'waiting',
                                            ]
                                            .includes(
                                              tokenLinkerDeployStatus.status
                                            ) ?
                                              'cursor-wait' :
                                              'cursor-default'
                                          } rounded flex items-center justify-center text-white font-medium p-1.5`
                                        }
                                      >
                                        {
                                          [
                                            'switching',
                                            'pending',
                                            'waiting',
                                          ]
                                          .includes(
                                            tokenLinkerDeployStatus.status
                                          ) &&
                                          (
                                            <div className="mr-1.5">
                                              <Oval
                                                width={14}
                                                height={14}
                                                color="#ffffff"
                                              />
                                            </div>
                                          )
                                        }
                                        <span
                                          className={
                                            `text-sm ${
                                              [
                                                'failed',
                                              ]
                                              .includes(
                                                tokenLinkerDeployStatus.status
                                              ) ?
                                                'ml-1 mr-0.5' :
                                                ''
                                            }`
                                          }
                                        >
                                          {tokenLinkerDeployStatus.message}
                                        </span>
                                        {
                                          [
                                            'failed',
                                          ]
                                          .includes(
                                            tokenLinkerDeployStatus.status
                                          ) &&
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
                                                onClick={
                                                  () => setTokenLinkerDeployStatus(null)
                                                }
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
                                      <button
                                        disabled={
                                          tokenLinkerDeployStatus &&
                                          tokenLinkerDeployStatus.status !== 'failed'
                                        }
                                        onClick={
                                          () =>
                                            deployTokenLinker(id)
                                        }
                                        className={
                                          `bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 w-full ${
                                            tokenLinkerDeployStatus?.chain &&
                                            tokenLinkerDeployStatus.chain !== id &&
                                            tokenLinkerDeployStatus.status !== 'failed' ?
                                              'cursor-not-allowed' :
                                              'cursor-pointer'
                                          } rounded flex items-center justify-center text-white font-medium hover:font-semibold space-x-1.5 p-1.5`
                                        }
                                      >
                                        <span className="uppercase text-sm">
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
              }
            </div> :
            <>
            </>
      }
    </div>
  )
}
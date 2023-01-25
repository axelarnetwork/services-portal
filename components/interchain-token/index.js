import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import _ from 'lodash'
import { Contract, ContractFactory, VoidSigner, constants, utils } from 'ethers'
import { predictContractConstant } from '@axelar-network/axelar-gmp-sdk-solidity'
import ERC20MintableBurnable from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/test/ERC20MintableBurnable.sol/ERC20MintableBurnable.json'
import ConstAddressDeployer from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/ConstAddressDeployer.sol/ConstAddressDeployer.json'
import { Blocks, Oval } from 'react-loader-spinner'
import { Tooltip } from '@material-tailwind/react'
import { BsFileEarmarkCheckFill, BsFillFileEarmarkArrowUpFill } from 'react-icons/bs'
import { HiOutlineSwitchHorizontal } from 'react-icons/hi'
import { BiMessage, BiCheck } from 'react-icons/bi'
import { IoClose } from 'react-icons/io5'

import RegisterTokenButton from './register-token-button'
import Image from '../image'
import Copy from '../copy'
import Wallet from '../wallet'
import Datatable from '../datatable'
import { get_chain, switch_chain } from '../../lib/chain/utils'
import { deploy_contract, is_contract_deployed, get_salt_from_key, get_contract_address_by_chain } from '../../lib/contract/utils'
import TokenLinkerProxy from '../../lib/contract/json/TokenLinkerProxy.json'
import TokenLinker from '../../lib/contract/json/TokenLinker.json'
import RemoteAddressValidatorProxy from '../../lib/contract/json/RemoteAddressValidatorProxy.json'
import RemoteAddressValidator from '../../lib/contract/json/RemoteAddressValidator.json'
import IUpgradable from '../../lib/contract/json/IUpgradable.json'
import { ellipse, loader_color, parse_error } from '../../lib/utils'
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
            status: 'success',
            message: 'Deploy token successful',
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

  const deployUpgradable = async (
    key = 'deployer',
    contract_json,
    contract_proxy_json,
    args = [],
    proxy_args = [],
    setup_params = '0x',
    _signer = signer,
    callback,
  ) => {
    let contract

    if (
      constant_address_deployer &&
      _signer &&
      key &&
      contract_json &&
      contract_proxy_json
    ) {
      const contract_factory =
        new ContractFactory(
          contract_json.abi,
          contract_json.bytecode,
          _signer,
        )

      try {
        if (callback) {
          callback(
            {
              status: 'pending',
              message: 'Please confirm',
            },
          )
        }

        const _contract =
          await contract_factory
            .deploy(
              ...args,
            )

        if (callback) {
          callback(
            {
              status: 'waiting',
              message: 'Waiting for confirmation',
            },
          )
        }

        await _contract.deployed()

        const proxy =
          await deployAndInitContractConstant(
            key,
            contract_proxy_json,
            proxy_args,
            [
              _contract.address,
              _signer.address,
              setup_params,
            ],
            _signer,
            callback ?
              response =>
                callback(
                  response,
                ) :
              undefined,
          )

        contract =
          new Contract(
            proxy.address,
            contract_json.abi,
            _signer,
          )
      } catch (error) {}
    }

    return contract
  }

  const upgradeUpgradable = async (
    proxy_contract_address,
    contract_json,
    args = [],
    setup_params = '0x',
    _signer = signer,
    callback,
  ) => {
    let response

    if (
      _signer &&
      proxy_contract_address &&
      contract_json
    ) {
      response = {
        ...response,
        proxy_contract_address,
      }

      const proxy =
        new Contract(
          proxy_contract_address,
          IUpgradable.abi,
          _signer,
        )

      const contract_factory =
        new ContractFactory(
          contract_json.abi,
          contract_json.bytecode,
          _signer,
        )

      try {
        if (callback) {
          callback(
            {
              status: 'pending',
              message: 'Please confirm',
            },
          )
        }

        const contract =
          await contract_factory
            .deploy(
              ...args,
            )

        if (callback) {
          callback(
            {
              status: 'waiting',
              message: 'Waiting for confirmation',
            },
          )
        }

        await contract.deployed()

        const contract_address = contract.address

        response = {
          ...response,
          contract_address,
        }

        const contract_code =
          await _signer.provider
            .getCode(
              contract_address,
            )

        if (callback) {
          callback(
            {
              status: 'pending',
              message: 'Please confirm',
            },
          )
        }

        const transaction =
          await proxy
            .upgrade(
              contract_address,
              utils.keccak256(
                contract_code
              ),
              setup_params,
            )

        if (callback) {
          callback(
            {
              status: 'waiting',
              message: 'Waiting for confirmation',
            },
          )
        }

        const receipt =
          await transaction
            .wait()

        const {
          status,
        } = { ...receipt }

        const failed = !status

        response =
          {
            ...response,
            status:
              failed ?
                'failed' :
                'success',
            message:
              failed ?
                'Failed to upgrade contract' :
                'Upgrade contract successful',
            receipt,
          }
      } catch (error) {
        response =
          {
            status: 'failed',
            ...parse_error(error),
          }
      }
    }

    return response
  }

  const deployAndInitContractConstant = async (
    key = 'deployer',
    contract_json,
    args = [],
    init_args = [],
    _signer = signer,
    callback,
  ) => {
    let contract

    if (
      constant_address_deployer &&
      _signer &&
      key &&
      contract_json
    ) {
      const contract_factory =
        new ContractFactory(
          contract_json.abi,
          contract_json.bytecode,
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
          contract_json.abi,
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
        if (callback) {
          callback(
            {
              status: 'pending',
              message: 'Please confirm',
            },
          )
        }

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

        await transaction
          .wait()
      } catch (error) {
        return (
          {
            status: 'failed',
            ...parse_error(error),
          }
        )
      }
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
        token_linker_address &&
        gateway_address &&
        gas_service_address &&
        !deployed
      ) {
        let remote_address_validator_address

        try {
          remote_address_validator_address =
            await predictContractConstant(
              constant_address_deployer,
              _signer,
              RemoteAddressValidatorProxy,
              'remoteAddressValidator',
            )
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
            const token_linker_contract =
              await deployUpgradable(
                'tokenLinker',
                TokenLinker,
                TokenLinkerProxy,
                [
                  gateway_address,
                  gas_service_address,
                  remote_address_validator_address,
                  chain,
                ],
                [],
                [],
                _signer,
                callback ?
                  response =>
                    callback(
                      response,
                    ) :
                  undefined,
              )

            const remote_address_validator_contract =
              token_linker_contract?.address &&
              await deployUpgradable(
                'remoteAddressValidator',
                RemoteAddressValidator,
                RemoteAddressValidatorProxy,
                [
                  token_linker_contract.address,
                  [],
                  [],
                ], 
                [],
                [],
                _signer,
                callback ?
                  response =>
                    callback(
                      response,
                    ) :
                  undefined,
              )

            const failed = !remote_address_validator_contract?.address

            response =
              {
                ...response,
                status:
                  failed ?
                    'failed' :
                    'success',
                message:
                  failed ?
                    'Failed to deploy contract' :
                    'Deploy contract successful',
              }

            if (!failed) {
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
  ) => {
    let response

    if (
      constant_address_deployer &&
      _signer
    ) {
      try {
        const token_linker_address =
          await predictContractConstant(
            constant_address_deployer,
            _signer,
            TokenLinkerProxy,
            'tokenLinker',
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
      TokenLinker.abi,
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

        const {
          status,
        } = { ...receipt }

        const failed = !status

        response =
          {
            ...response,
            status:
              failed ?
                'failed' :
                'success',
            message:
              failed ?
                'Failed to register token' :
                'Register token successful',
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

        const {
          status,
        } = { ...receipt }

        const failed = !status

        response =
          {
            ...response,
            status:
              failed ?
                'failed' :
                'success',
            message:
              failed ?
                'Failed to deploy remote tokens' :
                'Deploy remote tokens successful',
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
      Array.isArray(chains)
    ) {
      try {
        const register_only =
          chains.length === 0

        const transaction =
          register_only ?
            await token_linker
              .registerToken(
                token_address,
              ) :
            await token_linker
              .registerTokenAndDeployRemoteTokens(
                token_address,
                chains,
              )

        const receipt =
          await transaction
            .wait()

        const {
          status,
        } = { ...receipt }

        const failed = !status

        response =
          {
            ...response,
            status:
              failed ?
                'failed' :
                'success',
            message:
              failed ?
                `Failed to register token${
                  register_only ?
                    '' :
                    ' and deploy remote tokens'
                }` :
                `Register token${
                  register_only ?
                    '' :
                    ' and deploy remote tokens'
                } successful`,
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

              const _chain_id = c.chain_id

              const provider =
                _chain_id === chain_id ?
                  signer :
                  new VoidSigner(
                    address,
                    rpcs[_chain_id],
                  )

              const token_linker =
                await getTokenLinker(
                  provider,
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
      setTokenAddress(token_address)
    },
    [token_address],
  )

  // setup token id from chain and token address
  useEffect(
    () => {
      const getTokenId = async () => {
        if (
          evm_chains_data &&
          rpcs &&
          token_linkers_data?.[selectedChain]
        ) {
          const {
            token_linker_address,
          } = { ...token_linkers_data[selectedChain] }

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

            const token_linker_contract =
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
                token_linker_contract,
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
      if (
        evm_chains_data &&
        rpcs &&
        token_linkers_data
      ) {
        if (tokenId) {
          getSupportedEvmChains()
            .forEach(async c => {
              const {
                id,
              } = { ...c }

              const {
                token_linker_address,
              } = { ...token_linkers_data[id] }

              if (token_linker_address) {
                const chain_data =
                  get_chain(
                    id,
                    evm_chains_data,
                  )

                const _chain_id = chain_data?.chain_id

                const token_linker_contract =
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
                  await getTokenAddress(
                    token_linker_contract,
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
    [evm_chains_data, rpcs, token_linkers_data, tokenId, address],
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
          !token_linkers_data ?
            <div className="w-full">
              <div className="h-full flex items-center justify-center">
                <Blocks />
              </div>
            </div> :
            !token_address ?
              <div className="w-full xl:px-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                  {
                    getSupportedEvmChains()
                      .map(c => {
                        const {
                          id,
                        } = { ...c }

                        return {
                          chain: id,
                          chain_data: c,
                          ...(
                            token_linkers_data[id]
                          ),
                        }
                      })
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

                        const _chain_id = chain_data?.chain_id

                        const address_url =
                          url &&
                          address_path &&
                          token_linker_address &&
                          `${url}${
                            address_path
                              .replace(
                                '{address}',
                                token_linker_address,
                              )
                          }`

                        const must_switch_network =
                          _chain_id &&
                          _chain_id !== chain_id

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
                                  <RegisterTokenButton
                                    tooltip="Register native token"
                                    placement="bottom"
                                    chainData={chain_data}
                                    supportedEvmChains={
                                      getSupportedEvmChains()
                                        .filter(c =>
                                          (
                                            !token_linkers_data ||
                                            token_linkers_data[c.id]?.deployed
                                          ) &&
                                          (
                                            !token_addresses_data ||
                                            !token_addresses_data[c.id] ||
                                            token_addresses_data[c.id] === constants.AddressZero
                                          )
                                        )
                                    }
                                    tokenLinker={
                                      getTokenLinkerContract(
                                        _chain_id === chain_id ?
                                          signer :
                                          address ?
                                            new VoidSigner(
                                              address,
                                              rpcs?.[_chain_id],
                                            ) :
                                            rpcs?.[_chain_id],
                                        token_linker_address,
                                      )
                                    }
                                    deployToken={deployToken}
                                    registerTokenAndDeployRemoteTokens={registerTokenAndDeployRemoteTokens}
                                    provider={
                                      _chain_id === chain_id ?
                                        signer :
                                        rpcs?.[_chain_id]
                                    }
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
                                    {
                                      address_url ?
                                        <a
                                          href={address_url}
                                          target="_blank"
                                          rel="noopenner noreferrer"
                                          className="sm:h-5 flex items-center text-blue-500 dark:text-blue-200 text-base sm:text-xs xl:text-sm font-semibold"
                                        >
                                          {ellipse(
                                            token_linker_address,
                                            10,
                                          )}
                                        </a> :
                                        <span className="sm:h-5 flex items-center text-slate-500 dark:text-slate-200 text-base sm:text-xs xl:text-sm font-medium">
                                          {ellipse(
                                            token_linker_address,
                                            10,
                                          )}
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
                                {
                                  deployed ?
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
                                                color="white"
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
                                      !token_linker_address ?
                                        <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50 w-full cursor-wait rounded flex items-center justify-center text-blue-500 dark:text-blue-600 font-medium p-1.5">
                                          <div className="mr-1.5">
                                            <Oval
                                              width={14}
                                              height={14}
                                              color={
                                                loader_color(theme)
                                              }
                                            />
                                          </div>
                                          <span>
                                            Loading
                                          </span>
                                        </div> :
                                        must_switch_network ?
                                          <Wallet
                                            connectChainId={_chain_id}
                                            className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 w-full cursor-pointer rounded flex items-center justify-center text-white font-medium hover:font-semibold space-x-1.5 p-1.5"
                                          >
                                            <span className="text-sm">
                                              Switch network to deploy
                                            </span>
                                          </Wallet> :
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
              </div> :
              <div className="w-full xl:px-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                  {
                    getSupportedEvmChains()
                      .map(c => {
                        const {
                          id,
                        } = { ...c }

                        return {
                          chain: id,
                          chain_data: c,
                          ...(
                            token_linkers_data[id]
                          ),
                        }
                      })
                      .filter(tl =>
                        tl.deployed
                      )
                      .map((tl, i) => {
                        const {
                          chain_data,
                          token_linker_address,
                        } = { ...tl }
                        const {
                          id,
                          chain_name,
                          name,
                          image,
                          explorer,
                        } = { ...chain_data }
                        const {
                          url,
                          address_path,
                        } = { ...explorer }

                        const _chain_data =
                          get_chain(
                            chain,
                            evm_chains_data,
                          )

                        const _id = _chain_data?.id
                        const _chain_id = _chain_data?.chain_id

                        const is_native = id === _id

                        const _tokenAddress =
                          is_native ?
                            tokenAddress :
                            token_addresses_data?.[id]

                        const registered =
                          token_addresses_data?.[chain] &&
                          token_addresses_data[chain] !== constants.AddressZero

                        const registered_or_deployed_remote =
                          token_addresses_data?.[id] &&
                          token_addresses_data[id] !== constants.AddressZero

                        const address_url =
                          url &&
                          address_path &&
                          (
                            is_native ||
                            registered_or_deployed_remote
                          ) &&
                          `${url}${
                            address_path
                              .replace(
                                '{address}',
                                _tokenAddress,
                              )
                          }`

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
                                    {
                                      is_native ||
                                      registered_or_deployed_remote ?
                                        'Token address' :
                                        'Status'
                                    }
                                  </div>
                                  <div className="border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between space-x-1 py-1.5 pl-1.5 pr-1">
                                    {
                                      address_url ?
                                        <a
                                          href={address_url}
                                          target="_blank"
                                          rel="noopenner noreferrer"
                                          className="sm:h-5 flex items-center text-blue-500 dark:text-blue-200 text-base sm:text-xs xl:text-sm font-semibold"
                                        >
                                          {ellipse(
                                            _tokenAddress,
                                            10,
                                          )}
                                        </a> :
                                        is_native ||
                                        registered_or_deployed_remote ?
                                          <span className="sm:h-5 flex items-center text-slate-500 dark:text-slate-200 text-base sm:text-xs xl:text-sm font-medium">
                                            {ellipse(
                                              _tokenAddress,
                                              10,
                                            )}
                                          </span> :
                                          <span className="sm:h-5 flex items-center text-slate-400 dark:text-slate-500 text-base sm:text-xs xl:text-sm font-medium">
                                            Remote token not deployed
                                          </span>
                                    }
                                    {
                                      (
                                        is_native ||
                                        registered_or_deployed_remote
                                      ) &&
                                      _tokenAddress &&
                                      (
                                        <Copy
                                          value={_tokenAddress}
                                        />
                                      )
                                    }
                                  </div>
                                </div>
                                {
                                  registered_or_deployed_remote ?
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
                                          {
                                            is_native ?
                                              'Registered' :
                                              'Deployed'
                                          }
                                        </span>
                                      </a> :
                                      <div className="bg-slate-50 dark:bg-slate-900 dark:bg-opacity-75 w-full rounded flex items-center justify-center text-green-500 dark:text-green-500 space-x-1.5 p-1.5">
                                        <BiCheck
                                          size={16}
                                        />
                                        <span className="text-sm font-medium">
                                          {
                                            is_native ?
                                              'Registered' :
                                              'Deployed'
                                          }
                                        </span>
                                      </div> :
                                    !token_linker_address ||
                                    (
                                      !token_addresses_data ||
                                      (
                                        tokenId &&
                                        !token_addresses_data[id]
                                      )
                                    ) ?
                                      <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50 w-full cursor-wait rounded flex items-center justify-center text-blue-500 dark:text-blue-600 font-medium p-1.5">
                                        <div className="mr-1.5">
                                          <Oval
                                            width={14}
                                            height={14}
                                            color={
                                              loader_color(theme)
                                            }
                                          />
                                        </div>
                                        <span>
                                          Loading
                                        </span>
                                      </div> :
                                      !registered &&
                                      !is_native ?
                                        <div className="bg-slate-50 dark:bg-slate-900 dark:bg-opacity-75 w-full cursor-not-allowed rounded flex items-center justify-center text-slate-400 dark:text-slate-500 space-x-1.5 p-1.5">
                                          <span className="text-sm font-medium">
                                            Native token not registered
                                          </span>
                                        </div> :
                                        <RegisterTokenButton
                                          buttonTitle={
                                            is_native ?
                                              'Register token' :
                                              'Deploy remote tokens'
                                          }
                                          buttonClassName="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 w-full cursor-pointer rounded flex items-center justify-center text-white font-medium hover:font-semibold space-x-1.5 p-1.5"
                                          chainData={_chain_data}
                                          supportedEvmChains={
                                            getSupportedEvmChains()
                                              .filter(c =>
                                                token_linkers_data[c.id]?.deployed &&
                                                token_addresses_data?.[c.id] === constants.AddressZero
                                              )
                                          }
                                          isNative={is_native}
                                          fixedTokenAddress={tokenAddress}
                                          initialRemoteChains={
                                            is_native ?
                                              undefined :
                                              [
                                                chain_name,
                                              ]
                                              .filter(c => c)
                                          }
                                          tokenId={tokenId}
                                          tokenLinker={
                                            getTokenLinkerContract(
                                              _chain_id === chain_id ?
                                                signer :
                                                address ?
                                                  new VoidSigner(
                                                    address,
                                                    rpcs?.[_chain_id],
                                                  ) :
                                                  rpcs?.[_chain_id],
                                              token_linker_address,
                                            )
                                          }
                                          deployRemoteTokens={deployRemoteTokens}
                                          registerTokenAndDeployRemoteTokens={registerTokenAndDeployRemoteTokens}
                                          provider={
                                            _chain_id === chain_id ?
                                              signer :
                                              rpcs?.[_chain_id]
                                          }
                                        />
                                }
                              </div>
                            </div>
                          </div>
                        )
                      })
                  }
                </div>
                {/*
                  <Datatable
                    columns={
                      getSupportedEvmChains()
                        .map(c => {
                          const {
                            id,
                            name,
                            image,
                            explorer,
                          } = { ...c }
                          const {
                            url,
                            address_path,
                          } = { ...explorer }

                          const _chain_id = c?.chain_id

                          const {
                            token_linker_address,
                            deployed,
                          } = {
                            ...(
                              token_linkers_data[id]
                            ),
                          }

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

                          const must_switch_network =
                            _chain_id &&
                            _chain_id !== chain_id

                          return {
                            Header:
                              (
                                <div className="w-full flex flex-col space-y-1.5">
                                  <div className="flex items-center space-x-1.5">
                                    <Image
                                      src={image}
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded-full"
                                    />
                                    <span className="whitespace-nowrap normal-case text-black dark:text-white text-xs font-bold">
                                      {name}
                                    </span>
                                  </div>
                                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between space-x-1 py-1.5 pl-2.5 pr-1.5">
                                    <div className="flex items-center normal-case text-xs space-x-0.5">
                                      {
                                        address_url ?
                                          <a
                                            href={address_url}
                                            target="_blank"
                                            rel="noopenner noreferrer"
                                            className="text-blue-500 dark:text-blue-200 font-semibold"
                                          >
                                            Linker
                                          </a> :
                                          <span className="text-slate-500 dark:text-slate-200 font-medium">
                                            Linker
                                          </span>
                                      }
                                      <Copy
                                        size={16}
                                        value={token_linker_address}
                                      />
                                    </div>
                                    {
                                      deployed ?
                                        <Tooltip
                                          placement="top"
                                          content="Deployed"
                                          className="z-50 bg-black text-white text-xs"
                                        >
                                          {
                                            address_url ?
                                              <a
                                                href={address_url}
                                                target="_blank"
                                                rel="noopenner noreferrer"
                                                className="flex items-center justify-end text-green-500 dark:text-green-500"
                                              >
                                                <BsFileEarmarkCheckFill
                                                  size={14}
                                                />
                                              </a> :
                                              <div className="flex items-center justify-center text-green-500 dark:text-green-500">
                                                <BsFileEarmarkCheckFill
                                                  size={14}
                                                />
                                              </div>
                                          }
                                        </Tooltip> :
                                        tokenLinkerDeployStatus?.chain === id ?
                                          <Tooltip
                                            placement="top"
                                            content={
                                              [
                                                'failed',
                                              ]
                                              .includes(
                                                tokenLinkerDeployStatus.status
                                              ) ?
                                                tokenLinkerDeployStatus.error_message ||
                                                tokenLinkerDeployStatus.message :
                                                tokenLinkerDeployStatus.message
                                            }
                                            className="z-50 bg-black text-white text-xs"
                                          >
                                            <div
                                              className={
                                                `w-full h-4 ${
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
                                                } flex items-center justify-center ${
                                                  [
                                                    'failed',
                                                  ]
                                                  .includes(
                                                    tokenLinkerDeployStatus.status
                                                  ) ?
                                                    'text-red-500 dark:text-red-600' :
                                                    'text-blue-500 dark:text-blue-600'
                                                }`
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
                                                  <Oval
                                                    width={14}
                                                    height={14}
                                                    color={
                                                      loader_color(theme)
                                                    }
                                                  />
                                                )
                                              }
                                              {
                                                [
                                                  'failed',
                                                ]
                                                .includes(
                                                  tokenLinkerDeployStatus.status
                                                ) &&
                                                (
                                                  <button
                                                    onClick={
                                                      () => setTokenLinkerDeployStatus(null)
                                                    }
                                                  >
                                                    <IoClose
                                                      size={14}
                                                    />
                                                  </button>
                                                )
                                              }
                                            </div>
                                          </Tooltip> :
                                          deployed === false ?
                                            <Tooltip
                                              placement="top"
                                              content={
                                                must_switch_network ?
                                                  'Switch network' :
                                                  'Deploy'
                                              }
                                              className="z-50 bg-black text-white text-xs"
                                            >
                                              {
                                                must_switch_network ?
                                                  <div>
                                                    <Wallet
                                                      connectChainId={_chain_id}
                                                      className="w-full cursor-pointer rounded flex items-center justify-center text-indigo-500 hover:text-indigo-600 dark:text-indigo-600 dark:hover:text-indigo-500"
                                                    >
                                                      <HiOutlineSwitchHorizontal
                                                        size={14}
                                                      />
                                                    </Wallet>
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
                                                      `w-full ${
                                                        tokenLinkerDeployStatus?.chain &&
                                                        tokenLinkerDeployStatus.chain !== id &&
                                                        tokenLinkerDeployStatus.status !== 'failed' ?
                                                          'cursor-not-allowed' :
                                                          'cursor-pointer'
                                                      } flex items-center justify-center text-indigo-500 hover:text-indigo-600 dark:text-indigo-600 dark:hover:text-indigo-500`
                                                    }
                                                  >
                                                    <BsFillFileEarmarkArrowUpFill
                                                      size={14}
                                                    />
                                                  </button>
                                              }
                                            </Tooltip> :
                                            <Tooltip
                                              placement="top"
                                              content="Loading"
                                              className="z-50 bg-black text-white text-xs"
                                            >
                                              <div
                                                className="w-full h-4 cursor-wait flex items-center justify-center text-blue-500 dark:text-blue-600"
                                              >
                                                <Oval
                                                  width={14}
                                                  height={14}
                                                  color={
                                                    loader_color(theme)
                                                  }
                                                />
                                              </div>
                                            </Tooltip>
                                    }
                                  </div>
                                </div>
                              ),
                            accessor: id,
                            disableSortBy: true,
                            Cell: props => {
                              return null
                            },
                            headerClassName: 'w-20 lg:w-full justify-start',
                          }
                        })
                    }
                    data={[]}
                    noPagination={true}
                    defaultPageSize={100}
                    className="no-border"
                  />
                */}
              </div>
      }
    </div>
  )
}
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import _ from 'lodash'
import moment from 'moment'
import { Contract, ContractFactory, VoidSigner } from 'ethers'
import { getContractAddress } from 'ethers/lib/utils'
import { predictContractConstant, deployUpgradable } from '@axelar-network/axelar-gmp-sdk-solidity'
import ERC20MintableBurnable from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/test/ERC20MintableBurnable.sol/ERC20MintableBurnable.json'
import UpgradableProxy from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/upgradables/Proxy.sol/Proxy.json'
import ConstAddressDeployer from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/ConstAddressDeployer.sol/ConstAddressDeployer.json'

import Wallet from '../wallet'
import { get_chain } from '../../lib/chain/utils'
import { deploy_contract, is_contract_deployed, get_salt_from_key, get_contract_address_by_chain } from '../../lib/contract/utils'
import Deployer from '../../lib/contract/json/Deployer.json'
import RemoteAddressValidator from '../../lib/contract/json/RemoteAddressValidator.json'
import TokenLinker from '../../lib/contract/json/TokenLinker.json'
import ITokenLinker from '../../lib/contract/json/ITokenLinker.json'
import { parse_error } from '../../lib/utils'
import { TOKEN_LINKERS_DATA } from '../../reducers/types'

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
    chain_id,
    web3_provider,
    address,
    signer,
  } = { ...wallet_data }

  const router = useRouter()
  const {
    query,
  } = { ...router }
  const {
    token_address,
  } = { ...query }

  const [tokenAddress, setTokenAddress] = useState('')



  /*** deployment ***/
  const deployToken = async (
    name,
    symbol,
    decimals = 18,
  ) => {
    let response

    if (
      signer &&
      name &&
      symbol
    ) {
      const contract =
        await deploy_contract(
          ERC20MintableBurnable,
          signer,
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
    }

    return response
  }

  const deployAndInitContractConstant = async (
    key = 'deployer',
    args = [],
    init_args = [],
  ) => {
    let contract

    if (
      constant_address_deployer &&
      signer &&
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
          signer,
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
          signer,
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
            .connect(signer)
            .deployAndInit(
              bytecode,
              salt,
              init_data,
            )

        await transaction.wait()
      } catch (error) {}
    }

    return contract
  }

  const deployTokenLinker = async () => {
    let response

    if (
      evm_chains_data &&
      constant_address_deployer &&
      gateway_addresses_data &&
      gas_service_addresses_data &&
      signer
    ) {
      const token_linker = await getTokenLinker()

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
          const remote_address_validator =
            await deployUpgradable(
              constant_address_deployer,
              signer,
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
        } catch (error) {}

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
            )

            response =
              {
                ...response,
                remote_address_validator_address,
                deployed:
                  await is_contract_deployed(
                    token_linker_address,
                    TokenLinker,
                    signer,
                  ),
              }
          } catch (error) {}
        }
      }
    }

    return response
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
          getContractAddress(
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
      } catch (error) {}
    }

    return response
  }

  const getTokenLinkerContract = token_address =>
    signer &&
    token_address &&
    new Contract(
      token_address,
      ITokenLinker.abi,
      signer,
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
    [evm_chains_data, constant_address_deployer, gateway_addresses_data, gas_service_addresses_data, rpcs, signer],
  )

  // setup token address from url params
  useEffect(
    () => {
      setTokenAddress(address)
    },
    [address],
  )

  return (
    <div className="space-y-8">
      
    </div>
  )
}
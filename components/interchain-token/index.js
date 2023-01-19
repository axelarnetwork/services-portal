import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'
import moment from 'moment'
import { Contract, ContractFactory } from 'ethers'
import { getContractAddress } from 'ethers/lib/utils'
import { predictContractConstant, deployUpgradable } from '@axelar-network/axelar-gmp-sdk-solidity'
import ERC20MintableBurnable from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/test/ERC20MintableBurnable.sol/ERC20MintableBurnable.json'
import UpgradableProxy from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/upgradables/Proxy.sol/Proxy.json'
import ConstAddressDeployer from '@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/ConstAddressDeployer.sol/ConstAddressDeployer.json'

import { deploy_contract, is_contract_deployed, get_salt_from_key } from '../../lib/contract/utils'
import Deployer from '../../lib/contract/json/Deployer.json'
import RemoteAddressValidator from '../../lib/contract/json/RemoteAddressValidator.json'
import TokenLinker from '../../lib/contract/json/TokenLinker.json'
import ITokenLinker from '../../lib/contract/json/ITokenLinker.json'
import { parse_error } from '../../lib/utils'

export default () => {
  const {
    preferences,
    evm_chains,
    cosmos_chains,
    assets,
    const_address_deployer,
    gateway_addresses,
    gas_service_addresses,
    wallet,
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
        wallet: state.wallet,
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
    wallet_data,
  } = { ...wallet }
  const {
    chain_id,
    address,
    signer,
  } = { ...wallet_data }

  useEffect(
    () => {
      // deployToken()
      deployTokenLinker()
    },
    [evm_chains_data, constant_address_deployer, gateway_addresses_data, gas_service_addresses_data, signer],
  )

  /* deployment */
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
      const deployer_address =
        await predictContractConstant(
          constant_address_deployer,
          signer,
          Deployer,
          'deployer',
        )

      const token_linker_address =
        getContractAddress(
          {
            from: deployer_address,
            nonce: 1,
          },
        )

      const chain_data =
        evm_chains_data
          .find(c =>
            c?.chain_id === chain_id
          )

      const {
        id,
        chain_name,
      } = { ...chain_data }

      const chain =
        chain_name ||
        id

      const gateway_address =
        gateway_addresses_data
          .find(d =>
            d?.chain === id
          )?.address

      const gas_service_address =
        gas_service_addresses_data
          .find(d =>
            d?.chain === id
          )?.address

      response =
        {
          chain,
          constant_address_deployer,
          deployer_address,
          token_linker_address,
          gateway_address,
          gas_service_address,
        }

      if (
        deployer_address &&
        token_linker_address &&
        gateway_address &&
        gas_service_address &&
        !(
          await is_contract_deployed(
            token_linker_address,
            TokenLinker,
            signer,
          )
        )
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
          } catch (error) {}
        }

        response =
          {
            ...response,
            remote_address_validator_address,
          }
      }

      response = {
        ...response,
        deployed:
          await is_contract_deployed(
            token_linker_address,
            TokenLinker,
            signer,
          ),
      }
    }

    return response
  }
  /* deployment */

  /* getter */
  const getTokenLinker = token_address =>
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
  /* getter */

  /* setter */
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
  /* setter */

  return (
    <div className="space-y-8">
      
    </div>
  )
}
import { Contract, ContractFactory, utils } from 'ethers'

export const deploy_contract = async (
  contract_json,
  signer,
  args = [],
  options = {},
) => {
  let contract

  const {
    abi,
    bytecode,
  } = { ...contract_json }

  if (
    abi &&
    bytecode &&
    signer
  ) {
    const contract_factory =
      new ContractFactory(
        abi,
        bytecode,
        signer,
      )

    contract =
      await contract_factory
        .deploy(
          ...args,
          {
            ...options,
          },
        )

    await contract.deployed()
  }

  return contract
}

export const is_contract_deployed = async (
  contract_address,
  contract_json,
  signer,
) => {
  let deployed

  const {
    abi,
  } = { ...contract_json }

  if (
    contract_address &&
    abi &&
    signer
  ) {
    try {
      const contract =
        new Contract(
          contract_address,
          abi,
          signer,
        )

      deployed =
        !!(
          await contract
            .deployed()
        )
    } catch (error) {
      deployed = false
    }
  }

  return deployed
}

export const get_salt_from_key = key =>
  utils.keccak256(
    utils.defaultAbiCoder
      .encode(
        [
          'string',
        ],
        [
          key,
        ],
      )
  )

export const get_contract_address_by_chain = (
  chain,
  data,
) =>
  chain &&
  Array.isArray(data) &&
  data
    .find(d =>
      d?.chain === chain
    )?.address

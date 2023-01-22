import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'
import { utils } from 'ethers'
import { DebounceInput } from 'react-debounce-input'

import Chains from './chains'
import { get_chain } from '../../lib/chain/utils'

export default () => {
  const {
    evm_chains,
    wallet,
    token_linkers,
  } = useSelector(state =>
    (
      {
        evm_chains: state.evm_chains,
        wallet: state.wallet,
        token_linkers: state.token_linkers,
      }
    ),
    shallowEqual,
  )
  const {
    evm_chains_data,
  } = { ...evm_chains }
  const {
    wallet_data,
  } = { ...wallet }
  const {
    chain_id,
  } = { ...wallet_data }
  const {
    token_linkers_data,
  } = { ...token_linkers }

  const router = useRouter()
  const {
    pathname,
    query,
  } = { ...router }
  const {
    chain,
    token_address,
  } = { ...query }

  const [selectedChain, setSelectedChain] = useState(null)
  const [input, setInput] = useState(null)

  useEffect(
    () => {
      setSelectedChain(
        chain ||
        (
          evm_chains_data &&
          (
            get_chain(
              chain_id,
              evm_chains_data,
            ) ||
            _.head(
              evm_chains_data
            )
          )?.id
        )
      )
    },
    [evm_chains_data, chain_id, chain],
  )

  useEffect(
    () => {
      if (typeof input !== 'string') {
        setInput(token_address)
      }
    },
    [token_address],
  )

  useEffect(
    () => {
      if (typeof input === 'string') {
        try {
          const _input =
            input ?
              utils.getAddress(
                input,
              ) :
              input

          router
            .push(
              `${
                pathname
                  .replace(
                    '/[chain]',
                    '',
                  )
                  .replace(
                    '/[token_address]',
                    '',
                  )
              }${
                selectedChain &&
                _input ?
                  `/${selectedChain}/${_input}` :
                  ''
              }`,
              undefined,
              {
                shallow: true,
              },
            )
        } catch (error) {}
      }
    },
    [selectedChain, input],
  )

  return (
    Object.values({ ...token_linkers_data })
      .filter(tl =>
        tl?.deployed
      )
      .length > 0 &&
    (
      <div className="w-full sm:max-w-md border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl flex items-center justify-between space-x-2.5 py-2 px-3">
        <DebounceInput
          debounceTimeout={500}
          size="small"
          type="text"
          placeholder={
            `Input your token address${
              get_chain(
                selectedChain,
                evm_chains_data,
              ) ?
                ` on ${
                  get_chain(
                    selectedChain,
                    evm_chains_data,
                  ).name
                }` :
                ''
            }`
          }
          value={input}
          onChange={e =>
            setInput(
              (e.target.value || '')
                .trim()
                .split(' ')
                .filter(s => s)
                .join('')
            )
          }
          className="w-full bg-transparent text-base ml-0.5"
        />
        <Chains
          chain={selectedChain}
          onSelect={
            c => setSelectedChain(c)
          }
        />
      </div>
    )
  )
}
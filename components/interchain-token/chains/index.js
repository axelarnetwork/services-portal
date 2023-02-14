import { useState, useEffect, useRef } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { BsQuestionCircle } from 'react-icons/bs'

import Items from './items'
import Image from '../../image'
import { getChain } from '../../../lib/chain/utils'

export default (
  {
    chain,
    onSelect,
  },
) => {
  const {
    evm_chains,
    wallet,
  } = useSelector(state =>
    (
      {
        evm_chains: state.evm_chains,
        wallet: state.wallet,
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

  const [hidden, setHidden] = useState(true)
  const [chainData, setChainData] = useState(null)

  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(
    () => {
      const handleClickOutside = e => {
        if (
          hidden ||
          buttonRef.current.contains(e.target) ||
          dropdownRef.current.contains(e.target)
        ) {
          return false
        }

        setHidden(!hidden)
      }

      document
        .addEventListener(
          'mousedown',
          handleClickOutside,
        )

      return () =>
        document
          .removeEventListener(
            'mousedown',
            handleClickOutside,
          )
    },
    [hidden, buttonRef, dropdownRef],
  )

  useEffect(
    () => {
      if (
        evm_chains_data &&
        (
          chain ||
          chain_id
        )
      ) {
        setChainData(
          getChain(
            chain ||
            chain_id,
            evm_chains_data,
          )
        )
      }
    },
    [evm_chains_data, chain, chain_id],
  )

  const onClick = () => setHidden(!hidden)

  const {
    image,
  } = { ...chainData }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onClick}
        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full flex items-center justify-center p-1"
      >
        {image ?
          <Image
            src={image}
            width={20}
            height={20}
            className="rounded-full"
          /> :
          <BsQuestionCircle
            size={16}
            className="text-slate-400 dark:text-slate-400"
          />
        }
      </button>
      <div
        ref={dropdownRef} 
        className={`dropdown ${hidden ? '' : 'open'} absolute top-0 right-0 mt-8`}
      >
        <div className="bottom-start">
          <Items
            value={chain}
            onClick={
              c => {
                if (onSelect) {
                  onSelect(c)
                }

                if (onClick) {
                  onClick()
                }
              }
            }
          />
        </div>
      </div>
    </div>
  )
}
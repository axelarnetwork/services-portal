import { useState, useEffect, useRef } from "react";
import { BsQuestionCircle } from "react-icons/bs";
import { RxCaretDown } from "react-icons/rx";
import { useSelector, shallowEqual } from "react-redux";

import { getChain } from "~/lib/chain/utils";

import Image from "../../image";
import Items from "./items";

export default (
  {
    disabled = false,
    chain,
    onSelect,
    displayName = false,
  },
) => {
  const {
    evm_chains,
    wallet,
  } = useSelector(
    state => (
      {
        evm_chains: state.evm_chains,
        wallet: state.wallet,
      }
    ),
    shallowEqual,
  );
  const {
    evm_chains_data,
  } = { ...evm_chains };
  const {
    wallet_data,
  } = { ...wallet };
  const {
    chain_id,
  } = { ...wallet_data };

  const [hidden, setHidden] = useState(true);
  const [chainData, setChainData] = useState(null);

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(
    () => {
      const handleClickOutside = e => {
        if (hidden || buttonRef.current.contains(e.target) || dropdownRef.current.contains(e.target)) {
          return false;
        }

        setHidden(!hidden);
      }

      document.addEventListener("mousedown", handleClickOutside);

      return () => document.removeEventListener("mousedown", handleClickOutside);
    },
    [hidden, buttonRef, dropdownRef],
  )

  useEffect(
    () => {
      if (evm_chains_data && (chain || chain_id)) {
        setChainData(getChain(chain || chain_id, evm_chains_data));
      }
    },
    [evm_chains_data, chain, chain_id],
  )

  const onClick = () => setHidden(!hidden);

  const {
    name,
    image,
  } = { ...chainData };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        disabled={disabled}
        onClick={onClick}
        className={`${displayName ? "" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full p-1"} ${disabled ? "cursor-not-allowed" : "cursor-pointer"} flex items-center justify-center`}
      >
        {image ?
          <Image
            src={image}
            width={20}
            height={20}
            className={`rounded-full ${displayName ? "mr-2" : ""}`}
          /> :
          <BsQuestionCircle
            size={16}
            className="text-slate-400 dark:text-slate-400"
          />
        }
        {
          displayName &&
          (
            <>
              <span className="whitespace-nowrap text-base font-bold">
                {name}
              </span>
              {
                !disabled &&
                (
                  <RxCaretDown
                    size={18}
                    className="ml-1"
                  />
                )
              }
            </>
          )
        }
      </button>
      <div
        ref={dropdownRef}
        className={`dropdown ${hidden ? "" : "open"} absolute top-0 right-0 mt-8`}
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
            displayName={displayName}
          />
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { BsQuestionCircle } from "react-icons/bs";
import { useSelector, shallowEqual } from "react-redux";

import { getChain } from "~/lib/chain/utils";

import Image from "../../image";
import Items from "./items";

const Chains = () => {
  const { evm_chains, wallet } = useSelector(
    (state) => ({
      evm_chains: state.evm_chains,
      wallet: state.wallet,
    }),
    shallowEqual
  );
  const { evm_chains_data } = { ...evm_chains };
  const { wallet_data } = { ...wallet };
  const { chain_id } = { ...wallet_data };

  const [hidden, setHidden] = useState(true);
  const [chainData, setChainData] = useState(null);

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        hidden ||
        buttonRef.current.contains(e.target) ||
        dropdownRef.current.contains(e.target)
      ) {
        return false;
      }

      setHidden(!hidden);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hidden, buttonRef, dropdownRef]);

  useEffect(() => {
    if (evm_chains_data && chain_id) {
      setChainData(getChain(chain_id, evm_chains_data));
    }
  }, [evm_chains_data, chain_id]);

  const onClick = () => setHidden(!hidden);

  const { image } = { ...chainData };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onClick}
        className="flex h-16 w-12 items-center justify-center"
      >
        {image ? (
          <Image
            src={image}
            width={24}
            height={24}
            className="rounded-full"
            alt="Chain Logo"
          />
        ) : (
          <BsQuestionCircle
            size={24}
            className="text-slate-400 dark:text-slate-400"
          />
        )}
      </button>
      <div
        ref={dropdownRef}
        className={`dropdown ${
          hidden ? "" : "open"
        } absolute top-0 left-3 mt-12`}
      >
        <div className="bottom-start">
          <Items onClick={onClick} />
        </div>
      </div>
    </div>
  );
};

export default Chains;

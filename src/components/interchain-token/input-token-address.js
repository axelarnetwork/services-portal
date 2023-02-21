import { useState, useEffect } from "react";
import { DebounceInput } from "react-debounce-input";
import { useSelector, shallowEqual } from "react-redux";
import { useRouter } from "next/router";
import { utils } from "ethers";
import _ from "lodash";

import { getChain } from "~/lib/chain/utils";
import { split, toArray } from "~/lib/utils";

import Chains from "./chains";

export default () => {
  const {
    evm_chains,
    wallet,
    token_linkers,
  } = useSelector(
    state => (
      {
        evm_chains: state.evm_chains,
        wallet: state.wallet,
        token_linkers: state.token_linkers,
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
  const {
    token_linkers_data,
  } = { ...token_linkers };

  const router = useRouter();
  const {
    pathname,
    query,
  } = { ...router };
  const {
    chain,
    token_address,
  } = { ...query };

  const [selectedChain, setSelectedChain] = useState(null);
  const [input, setInput] = useState(null);

  useEffect(
    () => {
      const supported_evm_chains_data = toArray(evm_chains_data)
        .filter(c =>
          c?.id &&
          c.chain_id &&
          !c.deprecated &&
          token_linkers_data?.[c.id]?.deployed
        );

      setSelectedChain(
        chain ||
        (
          evm_chains_data &&
          token_linkers_data &&
          (getChain(chain_id, supported_evm_chains_data) || _.head(supported_evm_chains_data))?.id
        )
      );
    },
    [evm_chains_data, chain_id, token_linkers_data, chain],
  )

  useEffect(
    () => {
      setInput(token_address || "");
    },
    [token_address],
  )

  useEffect(
    () => {
      if (typeof input === "string") {
        try {
          const _input = input ? utils.getAddress(input) : input;

          router.push(
            `${pathname.replace("/[chain]", "").replace("/[token_address]", "")}${selectedChain && _input ? `/${selectedChain}/${_input}` : ""}`,
            undefined,
            {
              shallow: true,
            },
          );
        } catch (error) {}
      }
    },
    [selectedChain, input],
  )

  return (
    Object.values({ ...token_linkers_data }).filter(tl => tl?.deployed).length > 0 &&
    (
      <div className="w-full sm:max-w-md border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl flex items-center justify-between space-x-2.5 py-2 px-3">
        <DebounceInput
          debounceTimeout={500}
          size="small"
          type="text"
          placeholder={`Search for an existing ERC-20 token address${getChain(selectedChain, evm_chains_data) ? ` on ${getChain(selectedChain, evm_chains_data).name}` : ""}`}
          value={input}
          onChange={e => setInput(split(e.target.value, "normal", " ").join(""))}
          className="w-full bg-transparent text-sm ml-0.5"
        />
        <Chains
          chain={selectedChain}
          onSelect={c => setSelectedChain(c)}
        />
      </div>
    )
  );
}
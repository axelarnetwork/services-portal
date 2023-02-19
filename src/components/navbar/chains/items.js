import { useState, useEffect } from "react";
import { useSelector, shallowEqual } from "react-redux";

import Image from "../../image";
import Wallet from "../../wallet";

const Chains = ({ onClick }) => {
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

  const [menus, setMenus] = useState(null);

  useEffect(() => {
    if (evm_chains_data) {
      setMenus(
        evm_chains_data.filter(
          (c) => c?.chain_id && !c.deprecated && c.gateway_address
        )
      );
    }
  }, [evm_chains_data]);

  return (
    menus && (
      <div className="backdrop-blur-16 flex w-40 flex-col rounded-lg py-1 shadow dark:shadow-slate-700">
        {menus.map((m, i) => {
          const { name, image } = { ...m };

          const selected = m.chain_id === chain_id;

          const disabled = selected;

          const item = (
            <div className="flex items-center space-x-2">
              <Image
                src={image}
                width={24}
                height={24}
                className="rounded-full"
                alt={name}
              />
              <span
                className={`whitespace-nowrap normal-case ${
                  selected ? "font-semibold" : "font-medium"
                }`}
              >
                {name}
              </span>
            </div>
          );

          const className = `w-full ${
            i === 0
              ? "rounded-t-lg"
              : i === menus.length - 1
              ? "rounded-b-lg"
              : ""
          } ${
            disabled ? "cursor-default" : "cursor-pointer"
          } flex items-center uppercase ${
            selected
              ? "hover:bg-slate-100 dark:hover:bg-slate-900 text-blue-500 dark:text-blue-500 text-sm font-bold"
              : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 text-sm font-normal hover:font-semibold"
          } space-x-1.5 py-2 px-3`;

          return (
            <div key={i}>
              <Wallet
                disabled={disabled}
                connectChainId={m.chain_id}
                onSwitch={onClick}
                className={className}
              >
                {item}
              </Wallet>
            </div>
          );
        })}
      </div>
    )
  );
};

export default Chains;

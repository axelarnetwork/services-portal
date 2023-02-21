import { useState, useEffect } from "react";
import { useSelector, shallowEqual } from "react-redux";

import Image from "../../image";

const ChainItems = ({ value, onClick, displayName = false }) => {
  const { evm_chains, token_linkers } = useSelector(
    (state) => ({
      evm_chains: state.evm_chains,
      token_linkers: state.token_linkers,
    }),
    shallowEqual
  );
  const { evm_chains_data } = { ...evm_chains };
  const { token_linkers_data } = { ...token_linkers };

  const [menus, setMenus] = useState(null);

  useEffect(() => {
    if (evm_chains_data && token_linkers_data) {
      setMenus(
        evm_chains_data.filter(
          (c) =>
            c?.id &&
            !c.deprecated &&
            c.gateway_address &&
            token_linkers_data[c.id]?.deployed
        )
      );
    }
  }, [evm_chains_data, token_linkers_data]);

  return (
    menus && (
      <div
        className={`${
          displayName ? "bg-white dark:bg-black" : "backdrop-blur-16"
        } w-40 shadow dark:shadow-slate-700 rounded-lg flex flex-col py-1`}
      >
        {menus.map((m, i) => {
          const { id, name, image } = { ...m };

          const selected = id === value;

          const disabled = selected;

          const item = (
            <div className="flex items-center space-x-2">
              <Image
                src={image}
                width={24}
                height={24}
                className="rounded-full"
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
            <div
              key={i}
              disabled={disabled}
              onClick={() => {
                if (onClick) {
                  onClick(id);
                }
              }}
              className={className}
            >
              {item}
            </div>
          );
        })}
      </div>
    )
  );
};

export default ChainItems;

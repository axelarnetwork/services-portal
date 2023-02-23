import { useSelector, shallowEqual } from "react-redux";
import { useRouter } from "next/router";

import { getChain } from "~/lib/chain/utils";
import { ellipse } from "~/lib/utils";

import Copy from "../copy";
import Image from "../image";

export default () => {
  const { evm_chains } = useSelector(
    (state) => ({
      evm_chains: state.evm_chains,
    }),
    shallowEqual
  );
  const { evm_chains_data } = { ...evm_chains };

  const router = useRouter();
  const { query } = { ...router };
  const { chain, token_address } = { ...query };

  const chain_data = getChain(chain, evm_chains_data);

  const { image, explorer } = { ...chain_data };

  const { url, address_path } = { ...explorer };

  const address_url =
    url &&
    address_path &&
    token_address &&
    `${url}${address_path.replace("{address}", token_address)}`;

  return (
    token_address &&
    chain_data && (
      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 space-x-0 sm:space-x-2">
        <div className="flex items-center space-x-2">
          <span className="whitespace-nowrap text-slate-400 dark:text-slate-200 text-lg">
            Token:
          </span>
          <div className="flex items-center space-x-1">
            {address_url ? (
              <a
                href={address_url}
                target="_blank"
                rel="noopenner noreferrer"
                className="sm:h-5 flex items-center text-blue-500 dark:text-blue-200 text-lg font-semibold"
              >
                {ellipse(token_address, 16)}
              </a>
            ) : (
              <span className="sm:h-5 flex items-center text-slate-500 dark:text-slate-200 text-lg font-medium">
                {ellipse(token_address, 20)}
              </span>
            )}
            <Copy size={20} value={token_address} />
          </div>
        </div>
        <div className="flex items-center space-x-0.5">
          <span className="text-slate-400 dark:text-slate-200 text-base">
            (
          </span>
          <div className="flex items-center space-x-2">
            <span className="whitespace-nowrap text-slate-400 dark:text-slate-200 text-base">
              home chain:
            </span>
            <Image
              src={image}
              width={5}
              height={5}
              className="w-5 h-5 rounded-full"
            />
          </div>
          <span className="text-slate-400 dark:text-slate-200 text-base">
            )
          </span>
        </div>
      </div>
    )
  );
};

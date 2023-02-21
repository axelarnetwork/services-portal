import { useSelector, shallowEqual } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";

import services from "~/config/services";
import { equalsIgnoreCase, toArray } from "~/lib/utils";

import ServicesInputSearch from "../../dashboard/input-search";
import InterchainTokenInputAddress from "../../interchain-token/input-token-address";
import InterchainTokenTokenId from "../../interchain-token/token-id";

const SubNavbar = () => {
  const { wallet } = useSelector(
    (state) => ({
      wallet: state.wallet,
    }),
    shallowEqual
  );
  const { wallet_data } = { ...wallet };
  const { signer } = { ...wallet_data };

  const router = useRouter();
  const { pathname, query } = { ...router };
  const { chain, token_address } = { ...query };

  let title;
  let subtitle;
  let right;
  let path;

  switch (pathname) {
    case "/": {
      title = "All Services";
      right = <ServicesInputSearch />;
      break;
    }
    default:
      const service = services.find(
        (s) =>
          equalsIgnoreCase(s?.path, pathname) ||
          toArray(s?.others_paths).findIndex((p) =>
            equalsIgnoreCase(p, pathname)
          ) > -1
      );

      if (service) {
        title = service.title;
        path = service.path;
      }

      switch (pathname) {
        // case "/interchain-token":
        case "/interchain-token/[chain]/[token_address]": {
          right = signer && (
            <div className="flex w-full flex-col space-y-1 sm:max-w-md sm:items-end">
              <InterchainTokenInputAddress />
              <InterchainTokenTokenId
                chain={chain}
                tokenAddress={token_address}
              />
            </div>
          );
          break;
        }
      }
      break;
  }

  const titleComponent = (
    <h1
      className="flex items-center whitespace-nowrap text-base font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 sm:text-lg"
      style={{
        height: "46px",
      }}
    >
      {title}
    </h1>
  );

  return (
    <div className="max-w-8xl mx-auto flex w-full flex-col px-3 pt-6 pb-2 sm:flex-row sm:items-center sm:px-4 xl:px-1">
      <div className="flex flex-col space-y-1">
        {title &&
          (path ? <Link href={path}>{titleComponent}</Link> : titleComponent)}
        {subtitle && (
          <h2 className="text-sm text-slate-400 dark:text-slate-600">
            {subtitle}
          </h2>
        )}
      </div>
      <span className="sm:ml-auto" />
      {right && (
        <>
          <span className="mt-2 ml-auto sm:mt-0" />
          {right}
        </>
      )}
    </div>
  );
};

export default SubNavbar;

import { shallowEqual, useSelector } from "react-redux";
import moment from "moment";

import _package from "../../../package.json";

const Footer = () => {
  const { preferences } = useSelector(
    (state) => ({
      preferences: state.preferences,
    }),
    shallowEqual
  );
  const { theme } = { ...preferences };

  const { version, dependencies } = { ..._package };

  return (
    <div
      className={`${theme} footer flex flex-col items-center space-y-2.5 p-3 sm:space-y-0 md:flex-row`}
    >
      <div className="flex w-full min-w-max items-center justify-center space-x-2 md:w-1/2 md:justify-start lg:w-1/4">
        {dependencies?.["@axelar-network/axelar-gmp-sdk-solidity"] && (
          <a
            href="https://github.com/axelarnetwork/axelar-gmp-sdk-solidity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-500"
          >
            GMP SDK v
            {dependencies["@axelar-network/axelar-gmp-sdk-solidity"].replace(
              "^",
              ""
            )}
          </a>
        )}
        {dependencies?.["@axelar-network/axelarjs-sdk"] && (
          <a
            href="https://github.com/axelarnetwork/axelarjs-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-500"
          >
            SDK v{dependencies["@axelar-network/axelarjs-sdk"].replace("^", "")}
          </a>
        )}
        {version && (
          <a
            href="https://github.com/axelarnetwork/services-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-500"
          >
            UI v{version.replace("^", "")}
          </a>
        )}
      </div>
      <div className="hidden w-full flex-wrap items-center justify-center lg:flex lg:w-2/4" />
      <div className="flex w-full min-w-max items-center justify-center space-x-1.5 md:w-1/2 md:justify-end lg:w-1/4">
        <span className="font-medium text-slate-500 dark:text-white">
          © {moment().format("YYYY")}
        </span>
        <a
          href={process.env.NEXT_PUBLIC_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-500"
        >
          {process.env.NEXT_PUBLIC_PROJECT_NAME}.
        </a>
        <span className="font-medium text-slate-500 dark:text-white">
          All rights reserved
        </span>
      </div>
    </div>
  );
};

export default Footer;

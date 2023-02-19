import Link from "next/link";

import Image from "../../image";

export default () => {
  return (
    <div className="logo ml-3 mr-1 sm:mr-3">
      <div className="flex flex-col items-start">
        <div className="flex w-full items-center">
          <Link href="/" className="min-w-max sm:mr-3">
            <div className="block dark:hidden">
              <Image
                src="/logos/logo.png"
                width={32}
                height={32}
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
            </div>
            <div className="hidden dark:block">
              <Image
                src="/logos/logo_white.png"
                width={32}
                height={32}
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
            </div>
          </Link>
          <div className="hidden sm:block">
            <Link
              href="/"
              className="whitespace-nowrap text-base font-semibold uppercase"
            >
              {process.env.NEXT_PUBLIC_APP_NAME}
            </Link>
          </div>
        </div>
        <div className="hidden sm:block">
          {process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet" && (
            <div className="ml-11 w-fit whitespace-nowrap text-xs font-medium uppercase text-slate-400 dark:text-slate-600">
              {process.env.NEXT_PUBLIC_ENVIRONMENT}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

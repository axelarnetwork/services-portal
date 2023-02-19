import Link from 'next/link'

import Image from '../../image'

export default () => {
  return (
    <div className="logo ml-3 mr-1 sm:mr-3">
      <div className="flex flex-col items-start">
        <div className="w-full flex items-center">
          <Link
            href="/"
            className="min-w-max sm:mr-3"
          >
            <div className="block dark:hidden">
              <Image
                src="/logos/logo.png"
                width={32}
                height={32}
                className="w-6 sm:w-8 h-6 sm:h-8"
              />
            </div>
            <div className="hidden dark:block">
              <Image
                src="/logos/logo_white.png"
                width={32}
                height={32}
                className="w-6 sm:w-8 h-6 sm:h-8"
              />
            </div>
          </Link>
          <div className="hidden sm:block">
            <Link
              href="/"
              className="whitespace-nowrap uppercase text-base font-semibold"
            >
              {process.env.NEXT_PUBLIC_APP_NAME}
            </Link>
          </div>
        </div>
        <div className="hidden sm:block">
          {
            process.env.NEXT_PUBLIC_ENVIRONMENT === 'testnet' &&
            (
              <div className="w-fit whitespace-nowrap uppercase text-slate-400 dark:text-slate-600 text-xs font-medium ml-11">
                {process.env.NEXT_PUBLIC_ENVIRONMENT}
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
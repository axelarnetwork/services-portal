import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector, shallowEqual } from 'react-redux'

import ServicesInputSearch from '../../dashboard/input-search'
import InterchainTokenInputAddress from '../../interchain-token/input-token-address'
import Copy from '../../copy'
import Image from '../../image'
import services from '../../../config/services'
import { numberFormat, equalsIgnoreCase, toArray, ellipse } from '../../../lib/utils'

export default () => {
  const {
    wallet,
  } = useSelector(
    state => (
      {
        wallet: state.wallet,
      }
    ),
    shallowEqual,
  )
  const {
    wallet_data,
  } = { ...wallet }
  const {
    signer,
  } = { ...wallet_data }

  const router = useRouter()
  const {
    pathname,
    query,
  } = { ...router }
  const {
    address,
    tx,
    id,
  } = { ...query }

  let title, subtitle, right, path

  switch (pathname) {
    case '/':
      title = 'All Services'
      right = <ServicesInputSearch />
      break
    default:
      const service =
        services
          .find(s =>
            equalsIgnoreCase(
              s?.path,
              pathname,
            ) ||
            toArray(s?.others_paths)
              .findIndex(p =>
                equalsIgnoreCase(
                  p,
                  pathname,
                )
              ) > -1
          )

      if (service) {
        title = service.title
        path = service.path
      }

      switch (pathname) {
        case '/interchain-token':
        case '/interchain-token/[chain]/[token_address]':
          right = signer && (<InterchainTokenInputAddress />)
          break
      }
      break
  }

  const titleComponent = (
    <h1
      className="flex items-center tracking-wider uppercase text-slate-800 dark:text-slate-200 text-base sm:text-lg font-extrabold"
      style={
        {
          height: '46px',
        }
      }
    >
      {title}
    </h1>
  )

  return (
    <div className="w-full max-w-8xl flex flex-col sm:flex-row sm:items-center mx-auto pt-6 pb-2 px-3 sm:px-4 xl:px-1">
      <div className="flex flex-col space-y-1">
        {
          title &&
          (
            path ?
              <Link
                href={path}
              >
                {titleComponent}
              </Link> :
              titleComponent
          )
        }
        {
          subtitle &&
          (
            <h2 className="text-slate-400 dark:text-slate-600 text-sm">
              {subtitle}
            </h2>
          )
        }
      </div>
      <span className="sm:ml-auto" />
      {
        right &&
        (
          <>
            <span className="mt-2 sm:mt-0 ml-auto" />
            {right}
          </>
        )
      }
    </div>
  )
}
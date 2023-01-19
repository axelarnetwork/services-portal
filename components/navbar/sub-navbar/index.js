import Link from 'next/link'
import { useRouter } from 'next/router'

import ServicesInputSearch from '../../dashboard/input-search'
import Copy from '../../copy'
import Image from '../../image'
import services from '../../../config/services'
import { number_format, equals_ignore_case, ellipse } from '../../../lib/utils'

export default () => {
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

  let title,
    subtitle,
    right

  switch (pathname) {
    case '/':
      title = 'All Services'

      right = (
        <ServicesInputSearch />
      )

      break
    default:
      const service =
        services
          .find(s =>
            equals_ignore_case(
              s?.path,
              pathname,
            ) ||
            (s?.others_paths || [])
              .findIndex(p =>
                equals_ignore_case(
                  p,
                  pathname,
                )
              ) > -1
          )

      if (service) {
        title = service.title
      }

      break
  }

  return (
    <div className="w-full max-w-8xl flex flex-col sm:flex-row sm:items-center mx-auto pt-6 pb-2 px-3 sm:px-4 xl:px-1">
      <div className="flex flex-col space-y-1">
        {
          title &&
          (
            <h1 className="uppercase text-slate-800 dark:text-slate-200 text-base sm:text-lg font-semibold">
              {title}
            </h1>
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
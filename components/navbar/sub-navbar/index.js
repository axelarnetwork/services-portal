import Link from 'next/link'
import { useRouter } from 'next/router'

import Copy from '../../copy'
import Image from '../../image'
import { number_format, ellipse } from '../../../lib/utils'

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
      title = 'Services'
      break
    default:
      break
  }

  return (
    <div className="w-full max-w-8xl flex flex-col sm:flex-row sm:items-center mx-auto py-2 px-2 sm:px-4  xl:px-0 sm:pt-4">
      <div className="flex flex-col space-y-1">
        {
          title &&
          (
            <h1 className="uppercase tracking-widest text-black dark:text-white text-sm sm:text-base font-medium">
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
      {right ?
        <>
          <span className="mt-0.5 sm:mt-0 ml-auto" />
          {right}
        </> :
        <div className="overflow-x-auto flex items-center mt-1 sm:mt-0">
          
        </div>
      }
    </div>
  )
}
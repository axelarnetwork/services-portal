import Link from 'next/link'
import { useRouter } from 'next/router'

import menus from './menus'

export default () => {
  const router = useRouter()
  const {
    pathname,
  } = { ...router }

  return (
    <div className="w-full hidden xl:flex items-center justify-start xl:space-x-6 mx-auto">
      {menus
        .map(m => {
          const {
            id,
            disabled,
            title,
            path,
            others_paths,
            external,
          } = { ...m }

          const selected = !external && (pathname === path || others_paths?.includes(pathname))

          const item = (
            <span className="whitespace-nowrap tracking-wider">
              {title}
            </span>
          )

          const className = `${disabled ? 'cursor-not-allowed' : ''} flex items-center uppercase ${selected ? 'text-blue-500 dark:text-blue-500 text-sm font-bold' : 'text-slate-600 hover:text-blue-400 dark:text-slate-300 dark:hover:text-blue-400 text-sm font-normal'} space-x-1`

          return (
            external ?
              <a
                key={id}
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {item}
              </a> :
              <Link
                key={id}
                href={path}
                className={className}
              >
                {item}
              </Link>
          )
        })
      }
    </div>
  )
}
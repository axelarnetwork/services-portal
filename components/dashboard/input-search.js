import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { DebounceInput } from 'react-debounce-input'

import { split } from '../../lib/utils'

export default () => {
  const router = useRouter()
  const {
    pathname,
    query,
  } = { ...router }
  const {
    search,
  } = { ...query }

  const [input, setInput] = useState(null)

  useEffect(
    () => {
      if (typeof input !== 'string') {
        setInput(search)
      }
    },
    [search],
  )

  useEffect(
    () => {
      if (typeof input === 'string') {
        router
          .push(
            `${pathname}${
              input ?
                `?${
                  new URLSearchParams(
                    {
                      search: input,
                    }
                  )
                  .toString()
                }` :
                ''
            }`,
            undefined,
            {
              shallow: true,
            },
          )
      }
    },
    [input],
  )

  return (
    <DebounceInput
      debounceTimeout={500}
      size="small"
      type="text"
      placeholder="Search..."
      value={input}
      onChange={
        e =>
          setInput(
            split(
              e.target.value,
              'normal',
              ' ',
            )
            .join(' ')
          )
      }
      className="w-full sm:w-80 bg-transparent border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-lg py-2 px-3"
    />
  )
}
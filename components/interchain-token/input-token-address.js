import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { utils } from 'ethers'
import { DebounceInput } from 'react-debounce-input'

export default () => {
  const router = useRouter()
  const {
    pathname,
    asPath,
    query,
  } = { ...router }
  const {
    token_address,
  } = { ...query }

  const [input, setInput] = useState(null)

  useEffect(
    () => {
      if (typeof input !== 'string') {
        setInput(token_address)
      }
    },
    [token_address],
  )

  useEffect(
    () => {
      if (typeof input === 'string') {
        try {
          const _input =
            input ?
              utils.getAddress(
                input,
              ) :
              input

          router
            .push(
              `${
                pathname
                  .replace(
                    '/[token_address]',
                    '',
                  )
              }/${_input}`,
              undefined,
              {
                shallow: true,
              },
            )
        } catch (error) {}
      }
    },
    [input],
  )

  return (
    <DebounceInput
      debounceTimeout={500}
      size="small"
      type="text"
      placeholder="Input your token address"
      value={input}
      onChange={e =>
        setInput(
          (e.target.value || '')
            .trim()
            .split(' ')
            .filter(s => s)
            .join('')
        )
      }
      className="w-full sm:max-w-md bg-transparent border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-lg py-2 px-3"
    />
  )
}
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'
import moment from 'moment'
import { BsArrowRightShort } from 'react-icons/bs'

import Image from '../image'
import services from '../../config/services'

export default () => {
  const router = useRouter()
  const {
    preferences,
    evm_chains,
    cosmos_chains,
    assets,
  } = useSelector(state =>
    (
      {
        preferences: state.preferences,
        evm_chains: state.evm_chains,
        cosmos_chains: state.cosmos_chains,
        assets: state.assets,
      }
    ),
    shallowEqual,
  )
  const {
    theme,
  } = { ...preferences }
  const {
    evm_chains_data,
  } = { ...evm_chains }
  const {
    cosmos_chains_data,
  } = { ...cosmos_chains }
  const {
    assets_data,
  } = { ...assets }

  const {
    query,
  } = { ...router }
  const {
    search,
  } = { ...query }

  const [inputSearch, setInputSearch] = useState('')
  const [filteredServices, setFilteredServices] = useState(services)

  useEffect(
    () => {
      setInputSearch(search)
    },
    [search],
  )

  useEffect(
    () => {
      setFilteredServices(
        services
          .filter(s => {
            const {
              title,
              tags,
            } = { ...s }

            return (
              !inputSearch ||
              _.concat(
                title,
                inputSearch.length > 1 ?
                  tags :
                  [],
              )
              .filter(d => d)
              .flatMap(d =>
                d
                  .replace(
                    /[^a-zA-Z0-9]/g,
                    ' ',
                  )
                  .split(' ')
              )
              .filter(w => w)
              .findIndex(w =>
                w
                  .toLowerCase()
                  .startsWith(
                    inputSearch
                      .toLowerCase()
                  )
              ) > -1
            )
          })
      )
    },
    [inputSearch],
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 mt-0 sm:mt-4">
      {
        filteredServices
          .map((s, i) => {
            const {
              title,
              path,
              description,
              image,
              tags,
              coming_soon,
            } = { ...s }

            return (
              <Link
                key={i}
                href={path}
                className="scale-100 hover:scale-105 ease-in duration-100 bg-white dark:bg-slate-900 bg-opacity-100 dark:bg-opacity-50 border-2 border-blue-200 hover:border-blue-600 dark:border-slate-800 dark:hover:border-slate-400 rounded-3xl py-8 px-5"
              >
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <Image
                      src={image}
                      className="rounded-xl"
                    />
                    <h3 className="text-blue-600 dark:text-white text-xl sm:text-2xl font-extrabold mt-8">
                      {title}
                    </h3>
                    <div className="text-slate-400 dark:text-slate-600 text-base font-light mt-3">
                      {description}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mt-8">
                      {
                        (tags || [])
                          .map((t, j) => {
                            return (
                              <div
                                key={j}
                                className="bg-slate-200 dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200 font-medium mr-1 mb-1 py-1 px-2"
                              >
                                {t}
                              </div>
                            )
                          })
                      }
                    </div>
                    <div className="flex items-center justify-between space-x-2 mt-2">
                      <div className="flex items-center text-blue-500 dark:text-blue-600 space-x-1">
                        <span className="text-base font-semibold">
                          Go to app
                        </span>
                        <BsArrowRightShort
                          size={20}
                          className="mt-0.5"
                        />
                      </div>
                      {
                        coming_soon &&
                        (
                          <div className="bg-red-100 dark:bg-red-300 border-2 border-red-600 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-800 font-medium mr-1 mb-1 py-0.5 px-2">
                            Coming Soon
                          </div>
                        )
                      }
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
      }
    </div>
  )
}
import { useSelector, shallowEqual } from 'react-redux'
import moment from 'moment'

import _package from '../../package.json'

export default () => {
  const {
    preferences,
  } = useSelector(state =>
    (
      {
        preferences: state.preferences,
      }
    ),
    shallowEqual,
  )
  const {
    theme,
  } = { ...preferences }

  const {
    version,
    dependencies,
  } = { ..._package }

  return (
    <div className={`${theme} footer flex flex-col md:flex-row items-center space-y-2.5 sm:space-y-0 p-3`}>
      <div className="w-full md:w-1/2 lg:w-1/4 min-w-max flex items-center justify-center md:justify-start space-x-2">
        {
          dependencies?.['@axelar-network/axelar-gmp-sdk-solidity'] &&
          (
            <a
              href="https://github.com/axelarnetwork/axelar-gmp-sdk-solidity"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm font-medium"
            >
              SDK v{
                dependencies['@axelar-network/axelar-gmp-sdk-solidity']
                  .replace(
                    '^',
                    '',
                  )
              }
            </a>
          )
        }
        {
          version &&
          (
            <a
              href="https://github.com/axelarnetwork/services-portal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm font-medium"
            >
              UI v{
                version
                  .replace(
                    '^',
                    '',
                  )
              }
            </a>
          )
        }
      </div>
      <div className="hidden lg:flex w-full lg:w-2/4 flex-wrap items-center justify-center" />
      <div className="w-full md:w-1/2 lg:w-1/4 min-w-max flex items-center justify-center md:justify-end space-x-1.5">
        <span className="text-slate-500 dark:text-white font-medium">
          © {
            moment()
              .format('YYYY')
          }
        </span>
        <a
          href={process.env.NEXT_PUBLIC_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 font-medium"
        >
          {process.env.NEXT_PUBLIC_PROJECT_NAME}.
        </a>
        <span className="text-slate-500 dark:text-white font-medium">
          All rights reserved
        </span>
      </div>
    </div>
  )
}
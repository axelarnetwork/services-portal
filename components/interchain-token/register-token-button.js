import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'
import { Contract, utils } from 'ethers'
import { DebounceInput } from 'react-debounce-input'
import { Oval } from 'react-loader-spinner'
import { MdAdd } from 'react-icons/md'
import { IoClose } from 'react-icons/io5'
import { BiCheck, BiX } from 'react-icons/bi'

import Modal from '../modal'
import Image from '../image'
import Copy from '../copy'
import Wallet from '../wallet'
import ERC20 from '../../lib/contract/json/ERC20.json'
import { ellipse, loader_color, sleep } from '../../lib/utils'

const DEFAULT_PRE_EXISTING_TOKEN = true

const getSteps = (
  preExistingToken = DEFAULT_PRE_EXISTING_TOKEN,
) =>
  [
    {
      id: 'select_pre_existing_token',
      title: 'Select flow',
      options:
        [
          {
            title: 'Pre-existing ERC20 token',
            value: true,
          },
          {
            title: 'New ERC20 token',
            value: false,
          },
        ],
    },
    {
      id: 'input_token',
      title:
        preExistingToken ?
          'Validate your ERC20 token' :
          'Deploy new ERC20 token',
    },
    {
      id: 'register_token',
      title: 'Register ERC20 token',
    },
  ]
  .map((s, i) => {
    return {
      ...s,
      step: i,
    }
  })

export default (
  {
    chainData,
    supportedEvmChains = [],
    deployToken,
    tokenLinker,
    registerTokenAndDeployRemoteTokens,
    provider,
  },
) => {
  const {
    preferences,
    wallet,
    token_linkers,
    token_addresses,
  } = useSelector(state =>
    (
      {
        preferences: state.preferences,
        wallet: state.wallet,
      }
    ),
    shallowEqual,
  )
  const {
    theme,
  } = { ...preferences }
  const {
    wallet_data,
  } = { ...wallet }
  const {
    chain_id,
    address,
    signer,
  } = { ...wallet_data }

  const [hidden, setHidden] = useState(true)
  const [preExistingToken, setPreExistingToken] = useState(DEFAULT_PRE_EXISTING_TOKEN)
  const [_preExistingToken, _setPreExistingToken] = useState(DEFAULT_PRE_EXISTING_TOKEN)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(getSteps())

  const [inputTokenAddress, setInputTokenAddress] = useState(null)
  const [tokenAddress, setTokenAddress] = useState(null)
  const [validTokenAddress, setValidTokenAddress] = useState(null)
  const [tokenData, setTokenData] = useState(null)

  const [validating, setValidating] = useState(false)
  const [validateResponse, setValidateResponse] = useState(null)
  const [deploying, setDeploying] = useState(false)
  const [deployResponse, setDeployResponse] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [registerResponse, setRegisterResponse] = useState(null)

  useEffect(
    () => {
      setSteps(
        getSteps(
          preExistingToken,
        )
      )
    },
    [preExistingToken],
  )

  useEffect(
    () => {
      setSteps(
        getSteps(
          _preExistingToken,
        )
      )
    },
    [_preExistingToken],
  )

  useEffect(
    () => {
      validate()
    },
    [inputTokenAddress],
  )

  const reset = () => {
    setHidden(true)
    setPreExistingToken(DEFAULT_PRE_EXISTING_TOKEN)
    _setPreExistingToken(DEFAULT_PRE_EXISTING_TOKEN)
    setCurrentStep(0)
    setSteps(
      getSteps()
    )

    setInputTokenAddress(null)
    setTokenAddress(null)
    setValidTokenAddress(null)
    setTokenData(null)

    setValidating(false)
    setValidateResponse(null)
    setDeploying(false)
    setDeployResponse(null)
    setRegistering(false)
    setRegisterResponse(null)
  }

  const validate = async () => {
    if (typeof inputTokenAddress === 'string') {
      setTokenAddress(null)
      setValidTokenAddress(null)
      setTokenData(null)
      setValidateResponse(null)

      if (inputTokenAddress) {
        setValidating(true)

        try {
          const _tokenAddress =
            utils.getAddress(
              inputTokenAddress,
            )

          setTokenAddress(_tokenAddress)

          try {
            const contract =
              new Contract(
                _tokenAddress,
                ERC20.abi,
                provider,
              )

            const name = await contract.name()
            const symbol = await contract.symbol()
            const decimals = await contract.decimals()

            setValidTokenAddress(true)
            setTokenData(
              {
                name,
                symbol,
                decimals,
              }
            )

            setValidateResponse(
              {
                status: 'success',
                message: 'Valid token address',
              }
            )
          } catch (error) {
            setValidTokenAddress(false)
            setTokenData(null)
            setValidateResponse(
              {
                status: 'failed',
                message: 'Cannot get token information',
              }
            )
          }
        } catch (error) {
          setTokenAddress(null)
          setValidTokenAddress(false)
          setTokenData(null)
          setValidateResponse(
            {
              status: 'failed',
              message: 'Invalid token address',
            }
          )
        }

        setValidating(false)
      }
    }
  }

  const _deployToken = async () => {
    setDeploying(true)

    // const response =
    //   deployToken &&
    //   tokenData &&
    //   await deployToken(
    //     tokenData.name,
    //     tokenData.symbol,
    //     tokenData.decimals,
    //     signer,
    //   )

    await sleep(5 * 1000)
    const response = {
      status: 'success',
      message: 'Deploy token successful',
      token_address: '0xfC3B4feb754d8082F745940347600D373f03dcaC',
    }

    const {
      code,
      token_address,
    } = { ...response }

    switch (code) {
      case 'user_rejected':
        setDeployResponse(null)
        break
      default:
        if (token_address) {
          setTokenAddress(token_address)
          setValidTokenAddress(true)
          setTokenData(
            {
              ...response,
            }
          )
        }

        setDeployResponse(response)
        break
    }

    setDeploying(false)
  }

  const {
    name,
    image,
    explorer,
  } = { ...chainData }
  const {
    url,
    contract_path,
  } = { ...explorer }

  const _chain_id = chainData?.chain_id

  const contract_url =
    url &&
    contract_path &&
    (
      preExistingToken ?
        tokenAddress :
        deployResponse?.token_address
    ) &&
    `${url}${
      contract_path
        .replace(
          '{address}',
          preExistingToken ?
            tokenAddress :
            deployResponse.token_address,
        )
    }`

  const must_switch_network =
    _chain_id &&
    _chain_id !== chain_id

  const disabled =
    validating ||
    deploying ||
    registering

  return (
    <Modal
      hidden={hidden}
      disabled={disabled}
      onClick={
        () =>
          setHidden(false)
      }
      buttonTitle={
        <MdAdd
          size={18}
        />
      }
      buttonClassName="hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-50 rounded-full text-blue-500 dark:text-blue-600 p-1.5"
      title={
        <div className="flex items-center justify-between normal-case space-x-2">
          <div className="flex items-center space-x-2">
            <span className="text-base font-medium">
              Register token on
            </span>
            <Image
              src={image}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-base font-bold">
              {name}
            </span>
          </div>
          <button
            disabled={disabled}
            onClick={
              () => reset()
            }
            className="hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-200 p-2"
          >
            <IoClose
              size={18}
            />
          </button>
        </div>
      }
      body={
        <div className="space-y-8 mt-4">
          <div className="space-y-1">
            <div
              className={
                `grid grid-cols-${steps.length} gap-1.5`
              }
            >
              {
                steps
                  .map(s => {
                    const {
                      id,
                      title,
                      step,
                    } = { ...s }

                    return (
                      <button
                        key={id}
                        disabled={
                          disabled ||
                          step > currentStep
                        }
                        onClick={
                          () => {
                            if (
                              !disabled &&
                              step < currentStep
                            ) {
                              setCurrentStep(step)
                            }
                          }
                        }
                        className={
                          `${
                            disabled ?
                              'cursor-not-allowed' :
                              step < currentStep ?
                                'cursor-pointer' :
                                ''
                          } flex items-center ${
                            step === 0 ?
                              'justify-start' :
                              step === steps.length - 1 ?
                                'justify-end' :
                                'justify-center'
                          } whitespace-nowrap ${
                            step < currentStep ?
                              'text-slate-700 dark:text-slate-200 font-semibold' :
                              step === currentStep ?
                                'font-bold' :
                                'text-slate-400 dark:text-slate-500 font-medium'
                          } text-2xs sm:text-xs`
                        }
                      >
                        {title}
                      </button>
                    )
                  })
              }
            </div>
            <div className="flex items-center justify-between space-x-1.5">
              {
                steps
                  .map(s => {
                    const {
                      id,
                      title,
                      step,
                    } = { ...s }

                    return (
                      <div
                        key={id}
                        className={
                          `${
                            step < steps.length - 1 ?
                              'w-full' :
                              ''
                          } flex items-center space-x-1.5`
                        }
                      >
                        <button
                          disabled={
                            disabled ||
                            step > currentStep
                          }
                          onClick={
                            () => {
                              if (
                                !disabled &&
                                step < currentStep
                              ) {
                                setCurrentStep(step)
                              }
                            }
                          }
                          className={
                            `w-8 h-8 ${
                              step < currentStep ?
                                `bg-blue-300 dark:bg-blue-400 ${
                                  disabled ?
                                    '' :
                                    'hover:bg-blue-400 dark:hover:bg-blue-500'   
                                }` :
                                step === currentStep ?
                                  'bg-blue-500 dark:bg-blue-600' :
                                  'bg-slate-100 dark:bg-slate-800'
                            } ${
                              disabled ?
                                'cursor-not-allowed' :
                                step < currentStep ?
                                  'cursor-pointer' :
                                  ''
                            } rounded-full flex items-center justify-center ${
                              step < currentStep ?
                                `text-slate-100 dark:text-slate-200 ${
                                  disabled ?
                                    '' :
                                    'hover:text-white dark:hover:text-slate-100'
                                } font-semibold` :
                                step === currentStep ?
                                  'text-white font-bold' :
                                  'text-slate-400 dark:text-slate-500 font-medium'
                            } text-base`
                          }
                          style={
                            {
                              minWidth: '2rem',
                            }
                          }
                        >
                          {step + 1}
                        </button>
                        {
                          step < steps.length - 1 &&
                          (
                            <div
                              className={
                                `w-full h-0.5 ${
                                  step < currentStep ?
                                    'bg-blue-500 dark:bg-blue-600' :
                                    'bg-slate-100 dark:bg-slate-800'
                                }`
                              }
                            />
                          )
                        }
                      </div>
                    )
                  })
              }
            </div>
          </div>
          <div className="flex justify-center">
            {
              steps[currentStep]?.id === 'select_pre_existing_token' ?
                <div className="flex flex-col space-y-2">
                  {
                    (steps[currentStep].options || [])
                      .map((o, i) => {
                        const {
                          title,
                          value,
                        } = { ...o }

                        return (
                          <div
                            key={i}
                            onClick={
                              () =>
                                _setPreExistingToken(value)
                            }
                            className={
                              `${
                                _preExistingToken === value ?
                                  'border-2 border-blue-500 dark:border-blue-600' :
                                  'border border-slate-200 dark:border-slate-800'
                              } cursor-pointer rounded-xl ${
                                _preExistingToken === value ?
                                  'text-blue-500 dark:text-blue-600 font-bold' :
                                  'text-slate-400 dark:text-slate-300'
                              } text-base py-2 px-3`
                            }
                          >
                            {title}
                          </div>
                        )
                      })
                  }
                </div> :
                steps[currentStep]?.id === 'input_token' ?
                  <div className="w-full space-y-5">
                    <div className="w-full flex flex-col space-y-3">
                      {
                        preExistingToken &&
                        (
                          <div className="w-full space-y-1">
                            <div className="text-slate-400 dark:text-slate-500 text-sm">
                              Token address
                            </div>
                            <DebounceInput
                              disabled={disabled}
                              debounceTimeout={500}
                              size="small"
                              type="text"
                              placeholder={
                                `Input your token address${
                                  name ?
                                    ` on ${name}` :
                                    ''
                                }`
                              }
                              value={inputTokenAddress}
                              onChange={
                                e =>
                                  setInputTokenAddress(
                                    (e.target.value || '')
                                      .trim()
                                      .split(' ')
                                      .filter(s => s)
                                      .join('')
                                  )
                              }
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-black dark:text-white text-base font-medium space-x-1 py-1.5 px-2.5"
                            />
                            {
                              validateResponse ?
                              <div
                                className={
                                  `flex items-center ${
                                    validateResponse.status === 'failed' ?
                                      'text-red-500 dark:text-red-600' :
                                      'text-green-500 dark:text-green-500'
                                  } text-sm space-x-0.5`
                                }
                              >
                                {
                                  validateResponse.status === 'failed' ?
                                  <BiX
                                    size={18}
                                    className="mt-0.5"
                                  /> :
                                  <BiCheck
                                    size={18}
                                  />
                                }
                                <span>
                                  {validateResponse.message}
                                </span>
                              </div> :
                              validating ?
                                <div className="flex items-center text-blue-500 dark:slate-200 text-sm space-x-0.5">
                                  <Oval
                                    width={16}
                                    height={16}
                                    color={
                                      loader_color(theme)
                                    }
                                  />
                                  <span>
                                    Validating
                                  </span>
                                </div> :
                                null
                            }
                          </div>
                        )
                      }
                      {
                        (
                          !preExistingToken ||
                          tokenData
                        ) &&
                        (
                          <>
                            <div className="w-full space-y-1">
                              <div className="text-slate-400 dark:text-slate-500 text-sm">
                                Token name
                              </div>
                              <DebounceInput
                                disabled={
                                  disabled ||
                                  preExistingToken
                                }
                                debounceTimeout={500}
                                size="small"
                                type="text"
                                placeholder={
                                  `${
                                    preExistingToken ?
                                      'Your' :
                                      'Input your'  
                                  } token name${
                                    name ?
                                      ` on ${name}` :
                                      ''
                                  }`
                                }
                                value={
                                  tokenData?.name ||
                                  ''
                                }
                                onChange={
                                  e =>
                                    setTokenData(
                                      {
                                        ...tokenData,
                                        name:
                                          (e.target.value || '')
                                            .trim()
                                            .split(' ')
                                            .filter(s => s)
                                            .join(' '),
                                      }
                                    )
                                }
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-black dark:text-white text-base font-medium space-x-1 py-1.5 px-2.5"
                              />
                            </div>
                            <div className="w-full space-y-1">
                              <div className="text-slate-400 dark:text-slate-500 text-sm">
                                Token symbol
                              </div>
                              <DebounceInput
                                disabled={
                                  disabled ||
                                  preExistingToken
                                }
                                debounceTimeout={500}
                                size="small"
                                type="text"
                                placeholder={
                                  `${
                                    preExistingToken ?
                                      'Your' :
                                      'Input your'  
                                  } token symbol${
                                    name ?
                                      ` on ${name}` :
                                      ''
                                  }`
                                }
                                value={
                                  tokenData?.symbol ||
                                  ''
                                }
                                onChange={
                                  e =>
                                    setTokenData(
                                      {
                                        ...tokenData,
                                        symbol:
                                          (e.target.value || '')
                                            .trim()
                                            .split(' ')
                                            .filter(s => s)
                                            .join(''),
                                      }
                                    )
                                }
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-black dark:text-white text-base font-medium space-x-1 py-1.5 px-2.5"
                              />
                            </div>
                            <div className="w-full space-y-1">
                              <div className="text-slate-400 dark:text-slate-500 text-sm">
                                Token decimals
                              </div>
                              <DebounceInput
                                disabled={
                                  disabled ||
                                  preExistingToken
                                }
                                debounceTimeout={500}
                                size="small"
                                type="number"
                                placeholder={
                                  `${
                                    preExistingToken ?
                                      'Your' :
                                      'Input your'  
                                  } token decimals${
                                    name ?
                                      ` on ${name}` :
                                      ''
                                  }`
                                }
                                value={tokenData?.decimals}
                                onChange={
                                  e => {
                                    const regex = /^[0-9.\b]+$/

                                    let value

                                    if (
                                      e.target.value === '' ||
                                      regex.test(
                                        e.target.value
                                      )
                                    ) {
                                      value = e.target.value
                                    }

                                    setTokenData(
                                      {
                                        ...tokenData,
                                        decimals:
                                          value ?
                                            Number(value) :
                                            null,
                                      }
                                    )
                                  }
                                }
                                onWheel={
                                  e =>
                                    e.target.blur()
                                }
                                onKeyDown={
                                  e =>
                                    [
                                      'e',
                                      'E',
                                      '-',
                                    ]
                                    .includes(e.key) &&
                                    e.preventDefault()
                                }
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-black dark:text-white text-base font-medium space-x-1 py-1.5 px-2.5"
                              />
                            </div>
                          </>
                        )
                      }
                    </div>
                    {
                      (
                        deploying ||
                        deployResponse
                      ) &&
                      (
                        <div className="space-y-2">
                          <div
                            className={
                              `${
                                deploying ?
                                  'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50' :
                                  deployResponse.status === 'failed' ?
                                    'bg-red-50 dark:bg-red-900 dark:bg-opacity-50' :
                                    'bg-green-50 dark:bg-green-900 dark:bg-opacity-50'
                              } rounded-lg flex items-center ${
                                deploying ?
                                  'text-blue-500 dark:text-blue-600' :
                                  deployResponse.status === 'failed' ?
                                    'text-red-500 dark:text-red-600' :
                                    'text-green-500 dark:text-green-500'
                              } text-sm space-x-0.5 py-1.5 px-2.5`
                            }
                          >
                            {
                              deploying ?
                                <Oval
                                  width={16}
                                  height={16}
                                  color={
                                    loader_color('light')
                                  }
                                /> :
                                deployResponse.status === 'failed' ?
                                  <BiX
                                    size={18}
                                    className="mt-0.5"
                                  /> :
                                  <BiCheck
                                    size={18}
                                  />
                            }
                            <span>
                              {
                                deploying ?
                                  'Deploying' :
                                  deployResponse.message
                              }
                            </span>
                          </div>
                          {
                            deployResponse?.token_address &&
                            (
                              <div className="border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between space-x-1 py-1.5 pl-2.5 pr-1.5">
                                {
                                  contract_url ?
                                    <a
                                      href={contract_url}
                                      target="_blank"
                                      rel="noopenner noreferrer"
                                      className="text-blue-500 dark:text-blue-200 text-sm sm:text-base font-semibold"
                                    >
                                      {ellipse(
                                        deployResponse.token_address,
                                        16,
                                      )}
                                    </a> :
                                    <span className="text-slate-500 dark:text-slate-200 text-sm sm:text-base font-medium">
                                      {ellipse(
                                        deployResponse.token_address,
                                        16,
                                      )}
                                    </span>
                                }
                                <Copy
                                  value={deployResponse.token_address}
                                />
                              </div>
                            )
                          }
                        </div>
                      )
                    }
                  </div> :
                  steps[currentStep]?.id === 'register_token' ?
                    <div className="w-full space-y-5">
                      
                    </div> :
                    null
            }
          </div>
          <div className="flex items-center justify-between space-x-2.5">
            {
              currentStep < 1 ?
                <div /> :
                <button
                  disabled={disabled}
                  onClick={
                    () =>
                      setCurrentStep(
                        currentStep - 1
                      )
                  }
                  className={
                    `${
                      disabled ?
                        'bg-slate-50 dark:bg-slate-800 cursor-not-allowed' :
                        'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'
                    } rounded-lg flex items-center justify-center ${
                      disabled ?
                        'text-slate-400 dark:text-slate-500' :
                        'text-slate-900 dark:text-slate-200'
                    } text-base font-medium py-1 px-2.5`
                  }
                >
                  Back
                </button>
            }
            {
              steps[currentStep]?.id === 'select_pre_existing_token' ?
                <button
                  disabled={disabled}
                  onClick={
                    () => {
                      setPreExistingToken(_preExistingToken)

                      setCurrentStep(
                        currentStep + 1
                      )

                      if (_preExistingToken !== preExistingToken) {
                        setInputTokenAddress(null)
                        setTokenAddress(null)
                        setValidTokenAddress(null)
                        setTokenData(null)

                        setValidating(false)
                        setValidateResponse(null)
                        setDeploying(false)
                        setDeployResponse(null)
                      }
                      else if (_preExistingToken) {
                        validate()
                      }
                    }
                  }
                  className={
                    `${
                      disabled ?
                        'bg-blue-300 dark:bg-blue-400 cursor-not-allowed' :
                        'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                    } rounded-lg flex items-center justify-center ${
                      disabled ?
                        'text-slate-50' :
                        'text-white'
                    } text-base font-medium py-1 px-2.5`
                  }
                >
                  Next
                </button> :
                steps[currentStep]?.id === 'input_token' ?
                  preExistingToken ?
                    <button
                      disabled={
                        disabled ||
                        !tokenData ||
                        validateResponse?.status === 'failed'
                      }
                      onClick={
                        () =>
                          setCurrentStep(
                            currentStep + 1
                          )
                      }
                      className={
                        `${
                          disabled ?
                            'bg-blue-300 dark:bg-blue-400 cursor-not-allowed' :
                            'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                        } rounded-lg flex items-center justify-center ${
                          disabled ?
                            'text-slate-50' :
                            'text-white'
                        } text-base font-medium py-1 px-2.5`
                      }
                    >
                      Next
                    </button> :
                    must_switch_network ?
                      <Wallet
                        connectChainId={_chain_id}
                        className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 cursor-pointer rounded-lg flex items-center justify-center text-white text-base font-medium hover:font-semibold space-x-1.5 py-1 px-2.5"
                      >
                        Switch network
                      </Wallet> :
                      deployResponse?.token_address ?
                        <button
                          disabled={disabled}
                          onClick={
                            () =>
                              setCurrentStep(
                                currentStep + 1
                              )
                          }
                          className={
                            `${
                              disabled ||
                              !tokenData ||
                              validateResponse?.status === 'failed' ?
                                'bg-blue-300 dark:bg-blue-400 cursor-not-allowed' :
                                'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                            } rounded-lg flex items-center justify-center ${
                              disabled ||
                              !tokenData ||
                              validateResponse?.status === 'failed' ?
                                'text-slate-50' :
                                'text-white'
                            } text-base font-medium py-1 px-2.5`
                          }
                        >
                          Next
                        </button> :
                        <button
                          disabled={
                            disabled ||
                            !(
                              tokenData &&
                              (
                                tokenData.name &&
                                tokenData.symbol &&
                                tokenData.decimals
                              )
                            )
                          }
                          onClick={
                            () =>
                              _deployToken()
                          }
                          className={
                            `${
                              disabled ||
                              !(
                                tokenData &&
                                (
                                  tokenData.name &&
                                  tokenData.symbol &&
                                  tokenData.decimals
                                )
                              ) ?
                                'bg-blue-300 dark:bg-blue-400 cursor-not-allowed' :
                                'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                            } rounded-lg flex items-center justify-center ${
                              disabled ||
                              !(
                                tokenData &&
                                (
                                  tokenData.name &&
                                  tokenData.symbol &&
                                  tokenData.decimals
                                )
                              ) ?
                                'text-slate-50' :
                                'text-white'
                            } text-base font-medium py-1 px-2.5`
                          }
                        >
                          {
                            deployResponse?.status === 'failed' ?
                              'Redeploy' :
                              'Deploy'
                          }
                        </button> :
                  steps[currentStep]?.id === 'register_token' ?
                    <div /> :
                    currentStep >= steps.length - 1 ?
                      <div /> :
                      <button
                        disabled={disabled}
                        onClick={
                          () =>
                            setCurrentStep(
                              currentStep + 1
                            )
                        }
                        className={
                          `${
                            disabled ?
                              'bg-blue-300 dark:bg-blue-400' :
                              'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                          } rounded-lg flex items-center justify-center ${
                            disabled ?
                              'cursor-not-allowed text-slate-50' :
                              'text-white'
                          } text-base font-medium py-1 px-2.5`
                        }
                      >
                        Next
                      </button>
            }
          </div>
        </div>
      }
      noCancelOnClickOutside={true}
      onClose={
        () =>
          reset()
      }
      noButtons={true}
      modalClassName="backdrop-blur-16 md:max-w-lg"
    />
  )
}
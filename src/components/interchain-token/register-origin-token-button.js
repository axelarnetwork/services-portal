import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useSelector, shallowEqual } from "react-redux";
import _ from "lodash";
import { Contract, utils } from "ethers";
import { DebounceInput } from "react-debounce-input";
import { Oval } from "react-loader-spinner";
import { MdAdd } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { BiCheck, BiX } from "react-icons/bi";

import Modal from "../modal";
import Image from "../image";
import Copy from "../copy";
import Wallet from "../wallet";
import { searchGMP } from "~/lib/api/gmp";
import { getChain } from "~/lib/chain/utils";
import ERC20 from "~/lib/contract/json/ERC20.json";
import {
  equalsIgnoreCase,
  ellipse,
  name as getName,
  split,
  toArray,
  loaderColor,
  sleep,
} from "~/lib/utils";

const DEFAULT_PRE_EXISTING_TOKEN = false;

const getSteps = (
  preExistingToken = DEFAULT_PRE_EXISTING_TOKEN,
  isOrigin = true,
  existingToken = false,
  hasDeployRemoteTokens = false
) =>
  [
    {
      id: "select_pre_existing_token",
      title: "Select flow",
      options: [
        {
          title: "New ERC20 token",
          value: false,
        },
        {
          title: "Pre-existing ERC20 token",
          value: true,
        },
      ],
    },
    {
      id: "input_token",
      title: preExistingToken
        ? `Validate${
            !isOrigin || hasDeployRemoteTokens ? "" : " your ERC20"
          } token`
        : `Deploy${
            !isOrigin || hasDeployRemoteTokens ? "" : " new"
          } ERC20 token`,
    },
    isOrigin
      ? {
          id: "register_origin_token",
          title: `Register${
            !isOrigin || hasDeployRemoteTokens ? "" : " ERC20"
          } token`,
        }
      : {
          id: "deploy_remote_tokens",
          title: "Deploy remote tokens",
        },
    {
      id: "remote_deployments",
      title: `${
        !isOrigin || hasDeployRemoteTokens ? "D" : "Remote d"
      }eployments`,
    },
  ]
    .filter((s) =>
      ["select_pre_existing_token"].includes(s?.id)
        ? !existingToken
        : ["remote_deployments"].includes(s?.id)
        ? !isOrigin || hasDeployRemoteTokens
        : true
    )
    .map((s, i) => {
      return {
        ...s,
        step: i,
      };
    });

const getDefaultRemoteChains = (supportedEvmChains = [], chainData) =>
  supportedEvmChains
    .filter((c) => c?.chain_name && (!chainData || c.id !== chainData.id))
    .map((c) => c.chain_name);

export default ({
  buttonTitle = <MdAdd size={18} />,
  buttonClassName = "hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-50 rounded-full text-blue-500 dark:text-blue-600 p-1.5",
  tooltip,
  placement = "top",
  chainData,
  supportedEvmChains = [],
  isOrigin = true,
  fixedTokenAddress = null,
  initialRemoteChains,
  tokenId,
  tokenLinker,
  deployToken,
  deployRemoteTokens,
  registerOriginTokenAndDeployRemoteTokens,
  provider,
}) => {
  const { preferences, evm_chains, wallet, token_linkers } = useSelector(
    (state) => ({
      preferences: state.preferences,
      evm_chains: state.evm_chains,
      wallet: state.wallet,
      token_linkers: state.token_linkers,
    }),
    shallowEqual
  );
  const { theme } = { ...preferences };
  const { evm_chains_data } = { ...evm_chains };
  const { wallet_data } = { ...wallet };
  const { token_linkers_data } = { ...token_linkers };
  const { chain_id, signer, address } = { ...wallet_data };

  const router = useRouter();
  const { pathname } = { ...router };

  const [hidden, setHidden] = useState(true);
  const [preExistingToken, setPreExistingToken] = useState(
    !!fixedTokenAddress || DEFAULT_PRE_EXISTING_TOKEN
  );
  const [_preExistingToken, _setPreExistingToken] = useState(
    !!fixedTokenAddress || DEFAULT_PRE_EXISTING_TOKEN
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(
    getSteps(DEFAULT_PRE_EXISTING_TOKEN, isOrigin, !!fixedTokenAddress)
  );

  const [inputTokenAddress, setInputTokenAddress] = useState(fixedTokenAddress);
  const [tokenAddress, setTokenAddress] = useState(null);
  const [validTokenAddress, setValidTokenAddress] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [remoteChains, setRemoteChains] = useState(null);
  const [calls, setCalls] = useState(null);

  const [validating, setValidating] = useState(false);
  const [validateResponse, setValidateResponse] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployResponse, setDeployResponse] = useState(null);
  const [deployingRemote, setDeployingRemote] = useState(false);
  const [deployRemoteResponse, setDeployRemoteResponse] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registerResponse, setRegisterResponse] = useState(null);

  useEffect(() => {
    setSteps(getSteps(preExistingToken, isOrigin, !!fixedTokenAddress));
  }, [preExistingToken]);

  useEffect(() => {
    setSteps(getSteps(_preExistingToken, isOrigin, !!fixedTokenAddress));
  }, [_preExistingToken]);

  useEffect(() => {
    setSteps(
      getSteps(
        preExistingToken,
        isOrigin,
        !!fixedTokenAddress,
        remoteChains?.length > 0
      )
    );
  }, [remoteChains]);

  useEffect(() => {
    setInputTokenAddress(fixedTokenAddress);
  }, [fixedTokenAddress]);

  useEffect(() => {
    if (!hidden) {
      validate();
    }
  }, [hidden, inputTokenAddress]);

  useEffect(() => {
    const update = async () => {
      const { receipt, chains } = {
        ...(tokenId ? deployRemoteResponse : registerResponse),
      };

      const { transactionHash } = { ...receipt };

      if (transactionHash && chains?.length > 0) {
        updateCalls(transactionHash);
      }
    };

    const interval = setInterval(() => update(), 0.25 * 60 * 1000);

    return () => clearInterval(interval);
  }, [deployRemoteResponse, registerResponse]);

  const reset = () => {
    setHidden(true);
    setPreExistingToken(!!fixedTokenAddress || DEFAULT_PRE_EXISTING_TOKEN);
    _setPreExistingToken(!!fixedTokenAddress || DEFAULT_PRE_EXISTING_TOKEN);
    setCurrentStep(0);
    setSteps(
      getSteps(DEFAULT_PRE_EXISTING_TOKEN, isOrigin, !!fixedTokenAddress)
    );

    setInputTokenAddress(fixedTokenAddress);
    setTokenAddress(null);
    setValidTokenAddress(null);
    setTokenData(null);
    setRemoteChains(
      initialRemoteChains ||
        getDefaultRemoteChains(supportedEvmChains, chainData)
    );
    setCalls(null);

    setValidating(false);
    setValidateResponse(null);
    setDeploying(false);
    setDeployResponse(null);
    setDeployingRemote(false);
    setDeployRemoteResponse(null);
    setRegistering(false);
    setRegisterResponse(null);
  };

  const validate = async () => {
    if (typeof inputTokenAddress === "string") {
      setTokenAddress(null);
      setValidTokenAddress(null);
      setTokenData(null);
      setValidateResponse(null);

      if (inputTokenAddress) {
        setValidating(true);

        try {
          const _tokenAddress = utils.getAddress(inputTokenAddress);

          setTokenAddress(_tokenAddress);

          try {
            const contract = new Contract(_tokenAddress, ERC20.abi, provider);

            const name = await contract.name();
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();

            setValidTokenAddress(true);
            setTokenData({
              name,
              symbol,
              decimals,
            });

            setValidateResponse({
              status: "success",
              message: "Valid token address",
            });
          } catch (error) {
            setValidTokenAddress(false);
            setTokenData(null);
            setValidateResponse({
              status: "failed",
              message: "Cannot get token information",
            });
          }
        } catch (error) {
          setTokenAddress(null);
          setValidTokenAddress(false);
          setTokenData(null);
          setValidateResponse({
            status: "failed",
            message: "Invalid token address",
          });
        }

        setValidating(false);
      }
    }
  };

  const _deployToken = async () => {
    setDeploying(true);

    const response =
      deployToken &&
      tokenData &&
      (await deployToken(
        tokenData.name,
        tokenData.symbol,
        tokenData.decimals,
        signer
      ));

    const { code, token_address } = { ...response };

    switch (code) {
      case "user_rejected": {
        setDeployResponse(null);
        break;
      }
      default:
        if (token_address) {
          setTokenAddress(token_address);
          setValidTokenAddress(true);
          setTokenData({
            ...response,
          });
        }
        setDeployResponse(response);
        break;
    }

    setDeploying(false);
  };

  const _deployRemoteTokens = async () => {
    setDeployingRemote(true);

    const response =
      tokenLinker &&
      tokenId &&
      deployRemoteTokens &&
      (await deployRemoteTokens(tokenLinker, tokenId, remoteChains));

    const { code } = { ...response };

    switch (code) {
      case "user_rejected": {
        setDeployRemoteResponse(null);
        break;
      }
      default:
        setDeployRemoteResponse(response);
        break;
    }

    setDeployingRemote(false);
  };

  const _registerOriginTokenAndDeployRemoteTokens = async () => {
    setRegistering(true);

    const response =
      tokenLinker &&
      registerOriginTokenAndDeployRemoteTokens &&
      tokenAddress &&
      (await registerOriginTokenAndDeployRemoteTokens(
        tokenLinker,
        tokenAddress,
        remoteChains
      ));

    const { code } = { ...response };

    switch (code) {
      case "user_rejected": {
        setRegisterResponse(null);
        break;
      }
      default:
        setRegisterResponse(response);
        break;
    }

    setRegistering(false);
  };

  const updateCalls = async (txHash) => {
    if (txHash) {
      try {
        const response = await searchGMP({ txHash });

        const { data } = { ...response };

        setCalls(data);
      } catch (error) {}
    }
  };

  const { name, image, explorer } = { ...chainData };
  const { url, contract_path, transaction_path } = { ...explorer };

  const _chain_id = chainData?.chain_id;

  const contract_url =
    url &&
    contract_path &&
    (preExistingToken ? tokenAddress : deployResponse?.token_address) &&
    `${url}${contract_path.replace(
      "{address}",
      preExistingToken ? tokenAddress : deployResponse.token_address
    )}`;

  const { receipt, chains } = {
    ...(tokenId ? deployRemoteResponse : registerResponse),
  };

  const transaction_url =
    url &&
    transaction_path &&
    receipt?.transactionHash &&
    `${url}${transaction_path.replace("{tx}", receipt.transactionHash)}`;

  const must_switch_network = _chain_id && _chain_id !== chain_id;

  const disabled =
    validating ||
    deploying ||
    deployingRemote ||
    registering ||
    (steps[currentStep]?.id === "remote_deployments" &&
      chains?.length > 0 &&
      receipt?.transactionHash &&
      toArray(calls).filter((c) => ["executed", "error"].includes(c?.status))
        .length < chains.length);

  const registeringOrDeployingRemote =
    steps[currentStep]?.id === "deploy_remote_tokens"
      ? deployingRemote
      : registering;

  const registerOrDeployRemoteResponse =
    steps[currentStep]?.id === "deploy_remote_tokens"
      ? deployRemoteResponse
      : registerResponse;

  return (
    <Modal
      hidden={hidden}
      disabled={disabled}
      tooltip={tooltip}
      placement={placement}
      onClick={() => setHidden(false)}
      buttonTitle={buttonTitle}
      buttonClassName={buttonClassName}
      title={
        <div className="flex items-center justify-between space-x-2 normal-case">
          <div className="flex items-center space-x-2">
            <span className="text-base font-medium">
              {isOrigin
                ? "Register origin token on"
                : "Deploy remote tokens from"}
            </span>
            <Image
              src={image}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full"
            />
            <span className="text-base font-bold">{name}</span>
          </div>
          <button
            disabled={disabled}
            onClick={() => reset()}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <IoClose size={18} />
          </button>
        </div>
      }
      body={
        <div className="mt-4 space-y-8">
          <div className="space-y-1">
            <div className={`grid grid-cols-${steps.length} gap-1.5`}>
              {steps.map((s) => {
                const { id, title, step } = { ...s };

                return (
                  <button
                    key={id}
                    disabled={disabled || step > currentStep}
                    onClick={() => {
                      if (!disabled && step < currentStep) {
                        setCurrentStep(step);
                      }
                    }}
                    className={`${
                      disabled
                        ? "cursor-not-allowed"
                        : step < currentStep
                        ? "cursor-pointer"
                        : ""
                    } flex items-center ${
                      step === 0
                        ? "justify-start"
                        : step === steps.length - 1
                        ? "justify-end"
                        : (steps.length / 2) % 2 === 0
                        ? step < steps.length / 2
                          ? "justify-start"
                          : "justify-end"
                        : "justify-center"
                    } whitespace-nowrap ${
                      step < currentStep
                        ? "font-semibold text-slate-700 dark:text-slate-200"
                        : step === currentStep
                        ? "font-bold"
                        : "font-medium text-slate-400 dark:text-slate-500"
                    } text-2xs sm:text-xs`}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between space-x-1.5">
              {steps.map((s) => {
                const { id, title, step } = { ...s };

                return (
                  <div
                    key={id}
                    className={`${
                      step < steps.length - 1 ? "w-full" : ""
                    } flex items-center space-x-1.5`}
                  >
                    <button
                      disabled={disabled || step > currentStep}
                      onClick={() => {
                        if (!disabled && step < currentStep) {
                          setCurrentStep(step);
                        }
                      }}
                      className={`h-8 w-8 ${
                        step < currentStep
                          ? `bg-blue-400 dark:bg-blue-500 ${
                              disabled
                                ? ""
                                : "hover:bg-blue-400 dark:hover:bg-blue-500"
                            }`
                          : step === currentStep
                          ? "bg-blue-500 dark:bg-blue-600"
                          : "bg-slate-100 dark:bg-slate-800"
                      } ${
                        disabled
                          ? "cursor-not-allowed"
                          : step < currentStep
                          ? "cursor-pointer"
                          : ""
                      } flex items-center justify-center rounded-full ${
                        step < currentStep
                          ? `text-slate-100 dark:text-slate-200 ${
                              disabled
                                ? ""
                                : "hover:text-white dark:hover:text-slate-100"
                            } font-semibold`
                          : step === currentStep
                          ? "font-bold text-white"
                          : "font-medium text-slate-400 dark:text-slate-500"
                      } text-base`}
                      style={{
                        minWidth: "2rem",
                      }}
                    >
                      {step + 1}
                    </button>
                    {step < steps.length - 1 && (
                      <div
                        className={`h-0.5 w-full ${
                          step < currentStep
                            ? "bg-blue-500 dark:bg-blue-600"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-center">
            {steps[currentStep]?.id === "select_pre_existing_token" ? (
              <div className="flex flex-col space-y-2">
                {toArray(steps[currentStep].options).map((o, i) => {
                  const { title, value } = { ...o };

                  return (
                    <div
                      key={i}
                      onClick={() => _setPreExistingToken(value)}
                      className={`${
                        _preExistingToken === value
                          ? "border-2 border-blue-500 dark:border-blue-600"
                          : "border border-slate-200 dark:border-slate-800"
                      } cursor-pointer rounded-xl ${
                        _preExistingToken === value
                          ? "font-bold text-blue-500 dark:text-blue-600"
                          : "text-slate-400 dark:text-slate-300"
                      } py-2 px-3 text-base`}
                    >
                      {title}
                    </div>
                  );
                })}
              </div>
            ) : steps[currentStep]?.id === "input_token" ? (
              <div className="w-full space-y-5">
                <div className="flex w-full flex-col space-y-3">
                  {preExistingToken && (
                    <div className="w-full space-y-1">
                      <div className="text-sm text-slate-400 dark:text-slate-500">
                        Token address
                      </div>
                      <DebounceInput
                        disabled={disabled || !!fixedTokenAddress}
                        debounceTimeout={500}
                        size="small"
                        type="text"
                        placeholder={`Input your token address${
                          name ? ` on ${name}` : ""
                        }`}
                        value={inputTokenAddress}
                        onChange={(e) =>
                          setInputTokenAddress(
                            split(e.target.value, "normal", " ").join("")
                          )
                        }
                        className="flex w-full items-center justify-between space-x-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-base font-medium text-black dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                      {validateResponse ? (
                        <div
                          className={`flex items-center ${
                            validateResponse.status === "failed"
                              ? "text-red-500 dark:text-red-600"
                              : "text-green-500 dark:text-green-500"
                          } space-x-0.5 text-sm`}
                        >
                          {validateResponse.status === "failed" ? (
                            <BiX size={18} className="mt-0.5" />
                          ) : (
                            <BiCheck size={18} />
                          )}
                          <span>{validateResponse.message}</span>
                        </div>
                      ) : validating ? (
                        <div className="dark:slate-200 flex items-center space-x-0.5 text-sm text-blue-500">
                          <Oval
                            width={16}
                            height={16}
                            color={loaderColor(theme)}
                          />
                          <span>Validating</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                  {(!preExistingToken || tokenData) && (
                    <>
                      <div className="w-full space-y-1">
                        <div className="text-sm text-slate-400 dark:text-slate-500">
                          Token name
                        </div>
                        <DebounceInput
                          disabled={disabled || preExistingToken}
                          debounceTimeout={2000}
                          size="small"
                          type="text"
                          placeholder={`${
                            preExistingToken ? "Your" : "Input your"
                          } token name${name ? ` on ${name}` : ""}`}
                          value={tokenData?.name || ""}
                          onChange={(e) => {
                            setTokenData({
                              ...tokenData,
                              name: split(e.target.value, "normal", " ").join(
                                " "
                              ),
                            });
                          }}
                          className="flex w-full items-center justify-between space-x-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-base font-medium text-black dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="w-full space-y-1">
                        <div className="text-sm text-slate-400 dark:text-slate-500">
                          Token symbol
                        </div>
                        <DebounceInput
                          disabled={disabled || preExistingToken}
                          debounceTimeout={500}
                          size="small"
                          type="text"
                          placeholder={`${
                            preExistingToken ? "Your" : "Input your"
                          } token symbol${name ? ` on ${name}` : ""}`}
                          value={tokenData?.symbol || ""}
                          onChange={(e) => {
                            setTokenData({
                              ...tokenData,
                              symbol: split(e.target.value, "normal", " ").join(
                                " "
                              ),
                            });
                          }}
                          className="flex w-full items-center justify-between space-x-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-base font-medium text-black dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="w-full space-y-1">
                        <div className="text-sm text-slate-400 dark:text-slate-500">
                          Token decimals
                        </div>
                        <DebounceInput
                          disabled={disabled || preExistingToken}
                          debounceTimeout={500}
                          size="small"
                          type="number"
                          placeholder={`${
                            preExistingToken ? "Your" : "Input your"
                          } token decimals${name ? ` on ${name}` : ""}`}
                          value={tokenData?.decimals}
                          onChange={(e) => {
                            const regex = /^[0-9.\b]+$/;

                            let value;

                            if (
                              e.target.value === "" ||
                              regex.test(e.target.value)
                            ) {
                              value = e.target.value;
                            }

                            setTokenData({
                              ...tokenData,
                              decimals: value ? Number(value) : null,
                            });
                          }}
                          onWheel={(e) => e.target.blur()}
                          onKeyDown={(e) =>
                            ["e", "E", "-"].includes(e.key) &&
                            e.preventDefault()
                          }
                          className="flex w-full items-center justify-between space-x-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-base font-medium text-black dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                </div>
                {(deploying || deployResponse) && (
                  <div className="space-y-2">
                    <div
                      className={`${
                        deploying
                          ? "bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50"
                          : deployResponse.status === "failed"
                          ? "bg-red-50 dark:bg-red-900 dark:bg-opacity-50"
                          : "bg-green-50 dark:bg-green-900 dark:bg-opacity-50"
                      } flex items-center rounded-lg ${
                        deploying
                          ? "text-blue-500 dark:text-blue-600"
                          : deployResponse.status === "failed"
                          ? "text-red-500 dark:text-red-600"
                          : "text-green-500 dark:text-green-500"
                      } space-x-0.5 py-1.5 px-2.5 text-sm`}
                    >
                      {deploying ? (
                        <Oval
                          width={16}
                          height={16}
                          color={loaderColor("light")}
                        />
                      ) : deployResponse.status === "failed" ? (
                        <BiX size={18} className="mt-0.5" />
                      ) : (
                        <BiCheck size={18} />
                      )}
                      <span>
                        {deploying
                          ? "Deploying your token"
                          : deployResponse.message}
                      </span>
                    </div>
                    {deployResponse?.token_address && (
                      <div className="flex items-center justify-between space-x-1 rounded-lg border border-slate-200 py-1.5 pl-2.5 pr-1.5 dark:border-slate-800">
                        {contract_url ? (
                          <a
                            href={contract_url}
                            target="_blank"
                            rel="noopenner noreferrer"
                            className="text-sm font-semibold text-blue-500 dark:text-blue-200 sm:text-base"
                          >
                            {ellipse(deployResponse.token_address, 16)}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-200 sm:text-base">
                            {ellipse(deployResponse.token_address, 16)}
                          </span>
                        )}
                        <Copy value={deployResponse.token_address} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : ["register_origin_token", "deploy_remote_tokens"].includes(
                steps[currentStep]?.id
              ) ? (
              <div className="w-full space-y-5">
                <div className="flex w-full flex-col space-y-3">
                  <div className="space-y-3 rounded-lg border border-slate-200 py-3.5 px-3 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-20 text-sm text-slate-400 dark:text-slate-500 sm:w-24 sm:text-base">
                        Token:
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2.5 text-base font-bold">
                          {tokenData?.name}
                        </span>
                        {tokenData?.symbol && (
                          <div className="rounded-lg bg-slate-100 py-0.5 px-2 text-base font-semibold dark:bg-slate-800">
                            {tokenData.symbol}
                          </div>
                        )}
                      </div>
                    </div>
                    {tokenData?.decimals && (
                      <div className="flex items-center space-x-2.5">
                        <div className="w-20 text-sm text-slate-400 dark:text-slate-500 sm:w-24 sm:text-base">
                          Decimals:
                        </div>
                        <span className="text-base font-semibold">
                          {tokenData.decimals}
                        </span>
                      </div>
                    )}
                  </div>
                  {tokenAddress && (
                    <div className="w-full space-y-1">
                      <div className="text-sm text-slate-400 dark:text-slate-500">
                        Token address
                      </div>
                      <div className="flex items-center justify-between space-x-1 rounded-lg border border-slate-200 py-1.5 pl-2.5 pr-1.5 dark:border-slate-800">
                        {contract_url ? (
                          <a
                            href={contract_url}
                            target="_blank"
                            rel="noopenner noreferrer"
                            className="text-sm font-semibold text-blue-500 dark:text-blue-200 sm:text-base"
                          >
                            {ellipse(tokenAddress, 16)}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-200 sm:text-base">
                            {ellipse(tokenAddress, 16)}
                          </span>
                        )}
                        <Copy value={tokenAddress} />
                      </div>
                    </div>
                  )}
                  {supportedEvmChains.filter((c) => c?.id !== chainData?.id)
                    .length > 0 && (
                    <div className="w-full space-y-1">
                      <div className="text-sm text-slate-400 dark:text-slate-500">
                        Chains to deploy remote tokens
                      </div>
                      <div className="flex flex-wrap items-center">
                        {supportedEvmChains
                          .filter(
                            (c) => c?.chain_name && c.id !== chainData?.id
                          )
                          .map((c, i) => {
                            const { chain_name, name, image } = { ...c };

                            const selected =
                              toArray(remoteChains).includes(chain_name);

                            return (
                              <button
                                key={i}
                                disabled={disabled}
                                onClick={() => {
                                  setRemoteChains(
                                    selected
                                      ? remoteChains.filter(
                                          (_c) => _c !== chain_name
                                        )
                                      : _.uniq(
                                          toArray(
                                            _.concat(remoteChains, chain_name)
                                          )
                                        )
                                  );
                                }}
                                title={name}
                                className={`border-2 ${
                                  selected
                                    ? "border-blue-600 dark:border-blue-700"
                                    : "border-transparent"
                                } mr-1.5 rounded-full p-0.5`}
                              >
                                <Image
                                  src={image}
                                  width={24}
                                  height={24}
                                  className={`h-6 w-6 ${
                                    selected
                                      ? ""
                                      : "opacity-70 hover:opacity-100"
                                  } rounded-full`}
                                />
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
                {(registeringOrDeployingRemote ||
                  registerOrDeployRemoteResponse) && (
                  <div className="space-y-2">
                    <div
                      className={`${
                        registeringOrDeployingRemote
                          ? "bg-blue-50 dark:bg-blue-900 dark:bg-opacity-50"
                          : registerOrDeployRemoteResponse.status === "failed"
                          ? "bg-red-50 dark:bg-red-900 dark:bg-opacity-50"
                          : "bg-green-50 dark:bg-green-900 dark:bg-opacity-50"
                      } flex items-center rounded-lg ${
                        registeringOrDeployingRemote
                          ? "text-blue-500 dark:text-blue-600"
                          : registerOrDeployRemoteResponse.status === "failed"
                          ? "text-red-500 dark:text-red-600"
                          : "text-green-500 dark:text-green-500"
                      } py-1.5 px-2.5 text-sm`}
                    >
                      {registeringOrDeployingRemote ? (
                        <Oval
                          width={16}
                          height={16}
                          color={loaderColor("light")}
                        />
                      ) : registerOrDeployRemoteResponse.status === "failed" ? (
                        <BiX size={18} className="mt-0.5" />
                      ) : (
                        <BiCheck size={18} />
                      )}
                      <span className="mx-0.5">
                        {registeringOrDeployingRemote
                          ? steps[currentStep]?.id === "deploy_remote_tokens"
                            ? "Deploying remote tokens"
                            : "Registering your origin token"
                          : registerOrDeployRemoteResponse.message}
                      </span>
                      {transaction_url && (
                        <a
                          href={transaction_url}
                          target="_blank"
                          rel="noopenner noreferrer"
                          className="ml-auto mr-0.5 font-semibold"
                        >
                          Receipt
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : steps[currentStep]?.id === "remote_deployments" ? (
              <div className="w-full space-y-1.5">
                <div className="whitespace-nowrap text-base font-bold">
                  Deploy via GMP
                </div>
                <div className="flex flex-col space-y-0.5 overflow-y-auto">
                  {toArray(chains).map((c, i) => {
                    const data = toArray(calls).find((_c) =>
                      equalsIgnoreCase(
                        _c?.call?.returnValues?.destinationChain,
                        c
                      )
                    );

                    const { call, status, gas_status } = { ...data };

                    const { transactionHash, logIndex } = { ...call };

                    const chain_data = getChain(c, evm_chains_data);

                    const { image } = { ...chain_data };

                    const statuses = [
                      data ? getName(status) : "Wating for ContractCall",
                    ];

                    let title;
                    let text_color;
                    let icon;

                    switch (status) {
                      case "executed":
                      case "express_executed":
                        break;
                      default:
                        switch (gas_status) {
                          case "gas_unpaid": {
                            statuses.push("Gas unpaid");
                            break;
                          }
                          case "gas_paid_enough_gas":
                          case "gas_paid": {
                            switch (status) {
                              case "error":
                              case "executing":
                              case "approved":
                                break;
                              default:
                                statuses.push("Gas paid");
                                break;
                            }
                            break;
                          }
                          case "gas_paid_not_enough_gas": {
                            statuses.push("Not enough gas");
                            break;
                          }
                          default:
                            break;
                        }
                        break;
                    }

                    title = toArray(statuses).join(" & ");

                    switch (status) {
                      case "executed":
                      case "express_executed": {
                        text_color = "text-green-500 dark:text-green-500";
                        break;
                      }
                      case "error": {
                        text_color = "text-red-500 dark:text-red-600";
                        break;
                      }
                      default:
                        text_color = "text-blue-500 dark:text-blue-600";
                        break;
                    }

                    switch (status) {
                      case "executed":
                      case "express_executed": {
                        icon = <BiCheck size={20} />;
                        break;
                      }
                      case "error": {
                        icon = <BiX size={20} className="mt-0.5" />;
                        break;
                      }
                      default:
                        icon = (
                          <Oval
                            width={20}
                            height={20}
                            color={loaderColor(theme)}
                          />
                        );
                        break;
                    }

                    const url = `${process.env.NEXT_PUBLIC_EXPLORER_URL}/gmp/${
                      transactionHash || receipt?.transactionHash
                    }${typeof logIndex === "number" ? `:${logIndex}` : ""}`;

                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopenner noreferrer"
                        className={`flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${text_color} space-x-2.5 py-1.5 px-1`}
                      >
                        <div className="flex items-center space-x-2">
                          <Image
                            src={image}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full"
                          />
                          <span className="text-sm font-medium">{title}</span>
                        </div>
                        {icon}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between space-x-2.5">
            {currentStep < 1 ? (
              <div />
            ) : (
              <button
                disabled={disabled}
                onClick={() => setCurrentStep(currentStep - 1)}
                className={`${
                  disabled
                    ? "cursor-not-allowed bg-slate-50 dark:bg-slate-800"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                } flex items-center justify-center rounded-lg ${
                  disabled
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-900 dark:text-slate-200"
                } py-1 px-2.5 text-base font-medium`}
              >
                Back
              </button>
            )}
            {steps[currentStep]?.id === "select_pre_existing_token" ? (
              <button
                disabled={disabled}
                onClick={() => {
                  setPreExistingToken(_preExistingToken);

                  setCurrentStep(currentStep + 1);

                  if (_preExistingToken !== preExistingToken) {
                    setInputTokenAddress(null);
                    setTokenAddress(null);
                    setValidTokenAddress(null);
                    setTokenData(null);

                    setValidating(false);
                    setValidateResponse(null);
                    setDeploying(false);
                    setDeployResponse(null);
                  } else if (_preExistingToken) {
                    validate();
                  }
                }}
                className={`${
                  disabled
                    ? "cursor-not-allowed bg-blue-300 dark:bg-blue-400"
                    : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                } flex items-center justify-center rounded-lg ${
                  disabled ? "text-slate-50" : "text-white"
                } py-1 px-2.5 text-base font-medium`}
              >
                Next
              </button>
            ) : steps[currentStep]?.id === "input_token" ? (
              preExistingToken ? (
                <button
                  disabled={
                    disabled ||
                    !tokenData ||
                    validateResponse?.status === "failed"
                  }
                  onClick={() => {
                    if (!remoteChains) {
                      setRemoteChains(
                        initialRemoteChains ||
                          getDefaultRemoteChains(supportedEvmChains, chainData)
                      );
                    }
                    setCurrentStep(currentStep + 1);
                  }}
                  className={`${
                    disabled
                      ? "cursor-not-allowed bg-blue-300 dark:bg-blue-400"
                      : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  } flex items-center justify-center rounded-lg ${
                    disabled ? "text-slate-50" : "text-white"
                  } py-1 px-2.5 text-base font-medium`}
                >
                  Next
                </button>
              ) : must_switch_network ? (
                <Wallet
                  connectChainId={_chain_id}
                  className="flex cursor-pointer items-center justify-center space-x-1.5 rounded-lg bg-blue-500 py-1 px-2.5 text-base font-medium text-white hover:bg-blue-600 hover:font-semibold dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Switch network
                </Wallet>
              ) : deployResponse?.token_address ? (
                <button
                  disabled={disabled}
                  onClick={() => {
                    if (!remoteChains) {
                      setRemoteChains(
                        initialRemoteChains ||
                          getDefaultRemoteChains(supportedEvmChains, chainData)
                      );
                    }
                    setCurrentStep(currentStep + 1);
                  }}
                  className={`${
                    disabled ||
                    !tokenData ||
                    validateResponse?.status === "failed"
                      ? "cursor-not-allowed bg-blue-300 dark:bg-blue-400"
                      : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  } flex items-center justify-center rounded-lg ${
                    disabled ||
                    !tokenData ||
                    validateResponse?.status === "failed"
                      ? "text-slate-50"
                      : "text-white"
                  } py-1 px-2.5 text-base font-medium`}
                >
                  Next
                </button>
              ) : (
                <button
                  disabled={
                    disabled ||
                    !(tokenData?.name && tokenData.symbol && tokenData.decimals)
                  }
                  onClick={() => _deployToken()}
                  className={`${
                    disabled ||
                    !(tokenData?.name && tokenData.symbol && tokenData.decimals)
                      ? "cursor-not-allowed bg-blue-300 dark:bg-blue-400"
                      : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  } flex items-center justify-center rounded-lg ${
                    disabled ||
                    !(tokenData?.name && tokenData.symbol && tokenData.decimals)
                      ? "text-slate-50"
                      : "text-white"
                  } py-1 px-2.5 text-base font-medium`}
                >
                  {deployResponse?.status === "failed" ? "Redeploy" : "Deploy"}
                </button>
              )
            ) : ["register_origin_token", "deploy_remote_tokens"].includes(
                steps[currentStep]?.id
              ) ? (
              must_switch_network ? (
                <Wallet
                  connectChainId={_chain_id}
                  className="flex cursor-pointer items-center justify-center space-x-1.5 rounded-lg bg-blue-500 py-1 px-2.5 text-base font-medium text-white hover:bg-blue-600 hover:font-semibold dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Switch network
                </Wallet>
              ) : registerOrDeployRemoteResponse?.status === "success" ? (
                registerOrDeployRemoteResponse.chains?.length > 0 &&
                receipt?.transactionHash ? (
                  <button
                    disabled={disabled}
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex items-center justify-center rounded-lg bg-blue-500 py-1 px-2.5 text-base font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    disabled={disabled}
                    onClick={async () => {
                      reset();

                      await sleep(2 * 1000);

                      router.push(
                        `${pathname
                          .replace("/[chain]", "")
                          .replace("/[token_address]", "")}/${
                          chainData.id
                        }/${tokenAddress}`,
                        undefined,
                        {
                          shallow: true,
                        }
                      );
                    }}
                    className="flex items-center justify-center rounded-lg bg-green-500 py-1 px-2.5 text-base font-medium text-white hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    Done
                  </button>
                )
              ) : (
                <button
                  disabled={
                    disabled ||
                    (steps[currentStep]?.id === "deploy_remote_tokens" &&
                      remoteChains.length < 1)
                  }
                  onClick={() => {
                    if (steps[currentStep]?.id === "deploy_remote_tokens") {
                      _deployRemoteTokens();
                    } else {
                      _registerOriginTokenAndDeployRemoteTokens();
                    }
                  }}
                  className={`${
                    disabled ||
                    (steps[currentStep]?.id === "deploy_remote_tokens" &&
                      remoteChains.length < 1)
                      ? "cursor-not-allowed bg-blue-300 dark:bg-blue-400"
                      : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  } flex items-center justify-center rounded-lg ${
                    disabled ||
                    (steps[currentStep]?.id === "deploy_remote_tokens" &&
                      remoteChains.length < 1)
                      ? "text-slate-50"
                      : "text-white"
                  } py-1 px-2.5 text-base font-medium`}
                >
                  {registerOrDeployRemoteResponse?.status === "failed"
                    ? "Retry"
                    : steps[currentStep]?.id === "deploy_remote_tokens"
                    ? "Deploy"
                    : "Register"}
                </button>
              )
            ) : steps[currentStep]?.id === "remote_deployments" ? (
              <button
                disabled={disabled}
                onClick={async () => {
                  reset();

                  await sleep(2 * 1000);

                  router.push(
                    `${pathname
                      .replace("/[chain]", "")
                      .replace("/[token_address]", "")}/${
                      chainData.id
                    }/${tokenAddress}`,
                    undefined,
                    {
                      shallow: true,
                    }
                  );
                }}
                className={`${
                  disabled
                    ? "bg-blue-300 dark:bg-blue-400"
                    : "bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600"
                } flex items-center justify-center rounded-lg ${
                  disabled ? "text-slate-50" : "text-white"
                } py-1 px-2.5 text-base font-medium`}
              >
                {disabled ? "Processing" : "Done"}
              </button>
            ) : currentStep >= steps.length - 1 ? (
              <div />
            ) : (
              <button
                disabled={disabled}
                onClick={() => setCurrentStep(currentStep + 1)}
                className={`${
                  disabled
                    ? "bg-blue-300 dark:bg-blue-400"
                    : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                } flex items-center justify-center rounded-lg ${
                  disabled ? "cursor-not-allowed text-slate-50" : "text-white"
                } py-1 px-2.5 text-base font-medium`}
              >
                Next
              </button>
            )}
          </div>
        </div>
      }
      noCancelOnClickOutside={true}
      onClose={() => reset()}
      noButtons={true}
      modalClassName="backdrop-blur-16 md:max-w-lg"
    />
  );
};

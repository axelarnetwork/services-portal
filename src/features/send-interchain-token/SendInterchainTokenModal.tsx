import { FC, useCallback, useMemo, useState } from "react";
import { HiExternalLink } from "react-icons/hi";
import { Oval } from "react-loader-spinner";
import { useSelector } from "react-redux";
import { JsonRpcProvider } from "@ethersproject/providers";
import { formatUnits } from "ethers/lib/utils.js";
import tw from "tailwind-styled-components";
import {
  erc20ABI,
  useAccount,
  useContractEvent,
  useNetwork,
  useQuery,
  useQueryClient,
  useSwitchNetwork,
} from "wagmi";

import Chains from "~/components/interchain-token/chains";
import Modal from "~/components/modal";
import { EvmChainsData } from "~/interface/evm_chains";
import { useERC20 } from "~/lib/contract/hooks/useERC20";
import { getWagmiChains } from "~/lib/providers/WagmiConfigProvider";
import { toArray } from "~/lib/utils";

import {
  TransactionState,
  useSendInterchainTokenMutation,
} from "./hooks/useSendInterchainTokenMutation";

export const SAMPLE_TOKEN = "0x5425890298aed601595a70AB815c96711a31Bc65";

function ChainPicker(props: {
  value: string;
  exclude?: string[];
  // eslint-disable-next-line no-unused-vars
  onChange?: (chain: EvmChainsData) => void;
}) {
  // @ts-ignore
  const { evm_chains_data } = useSelector(
    // @ts-ignore
    ({ evm_chains }) => evm_chains
  );
  return (
    <Chains
      chain={props.value}
      exclude={props.exclude}
      onSelect={(c: {}) => {
        const chainData = toArray(evm_chains_data).find((_c) => _c.id === c);
        if (chainData) props.onChange?.(chainData);
      }}
      displayName={true}
    />
  );
}

export function useTokenBalance(
  tokenAddress: string,
  provider: JsonRpcProvider
) {
  const { address } = useAccount();
  const erc20 = useERC20({
    address: tokenAddress,
    signerOrProvider: provider,
  });

  return useQuery(
    ["tokenBalance", tokenAddress, provider.connection.url],
    async () => {
      if (!(erc20 && address)) return;

      const balance = await erc20.balanceOf(address);
      const decimals = await erc20.decimals();
      return formatUnits(balance, decimals);
    },
    {
      enabled: !!address && !!provider && !!erc20,
    }
  );
}

const StyledInput = tw.input`
  className="w-full bg-slate-50 
  dark:bg-slate-900 border border-slate-200 
  dark:border-slate-800 rounded-lg 
  flex items-center justify-between 
  text-black dark:text-white 
  text-base 
  font-medium 
  space-x-1 py-1.5 px-2.5
`;

const StyledLabel = tw.label`
  text-slate-400 dark:text-slate-500 text-sm
`;

type Props = {
  tokenAddress: `0x${string}`;
  tokenId: `0x${string}`;
  fromNetworkId: number;
  fromNetworkName: string;
};

const SendInterchainTokenModal: FC<Props> = (props) => {
  const { mutateAsync: sendToken } = useSendInterchainTokenMutation({
    tokenAddress: props.tokenAddress,
    tokenId: props.tokenId,
  });
  const { address: recipientAddress } = useAccount();

  const { chain: currentMMChain } = useNetwork();

  const [amount, setAmount] = useState<string>("");
  const [toChain, setToChain] = useState<EvmChainsData | null>(null);
  const [sendTxState, setSendTxState] = useState<TransactionState>({
    type: "idle",
  });

  const wagmiChains = getWagmiChains();

  const provider = new JsonRpcProvider(
    wagmiChains.find((t) => t.id === props.fromNetworkId)?.rpcUrls.public
      .http[0] as string
  );

  const balance = useTokenBalance(props.tokenAddress, provider);

  const { switchNetwork } = useSwitchNetwork({
    onSuccess(data) {
      console.log("Success", data);
    },
  });

  const switchWallet = useCallback(async () => {
    if (currentMMChain?.id !== props.fromNetworkId) {
      await switchNetwork?.(
        getWagmiChains().find((t) => t.id === props.fromNetworkId)?.id
      );
    }
  }, [props.fromNetworkId, currentMMChain, switchNetwork]);

  const destTokenAddress = useSelector(
    // @ts-ignore
    ({ token_addresses }) =>
      token_addresses.token_addresses_data[
        String(toChain?.chain_name?.toLowerCase())
      ]
  );

  const queryClient = useQueryClient();

  useContractEvent({
    // once: true,
    chainId: toChain?.chain_id,
    address: destTokenAddress as `0x${string}`,
    abi: erc20ABI,
    eventName: "Transfer",
    listener(fromAddress, toAddress, amount) {
      console.log({
        "Transfer(fromAddress, toAddress, amount)": {
          fromAddress,
          toAddress,
          amount,
        },
      });
      if (toAddress === recipientAddress) {
        const destinationProviderUrl = wagmiChains.find(
          (t) => t.id === toChain?.chain_id
        )?.rpcUrls.public.http[0] as string;

        const queryKey = [
          "tokenBalance",
          destTokenAddress,
          destinationProviderUrl,
        ];

        queryClient.invalidateQueries(queryKey);
        setSendTxState({ type: "idle" });
      }
    },
  });

  const isModalConfirmDisable = !(toChain && Number(amount));

  const handleConfirm = useCallback(async () => {
    if (isModalConfirmDisable) {
      console.log(
        "SendInterchainTokenModal toChain or amount not specified",
        toChain,
        amount
      );
      return;
    }

    await sendToken({
      tokenAddress: props.tokenAddress,
      tokenId: props.tokenId,
      toNetwork: toChain.chain_name,
      fromNetwork: props.fromNetworkName,
      amount,
      onFinished: balance.refetch,
      onStatusUpdate: setSendTxState,
    });
  }, [
    isModalConfirmDisable,
    sendToken,
    props.tokenAddress,
    props.tokenId,
    props.fromNetworkName,
    toChain,
    amount,
    balance.refetch,
  ]);

  const confirmButtonTitle = useMemo(() => {
    if (!toChain) return "Select destination chain";
    if (!Number(amount)) return "Enter amount";
    return "Send token";
  }, [toChain, amount]);

  const renderModalButton = () => {
    if (currentMMChain?.id !== props.fromNetworkId) return null;
    const sendStatusTxtMap = {
      idle: "Send token cross-chain",
      approving: "Wait for approval",
      sending: "Sending in progress...",
    };

    const isLoading = ["approving", "sending"].includes(sendTxState.type);

    return (
      <Modal
        tooltip={false}
        title={
          <div className="flex items-center gap-2">
            <div>Send Interchain Token to</div>
            <ChainPicker
              value={toChain?.chain_name || ""}
              exclude={[props.fromNetworkName]}
              onChange={(chain) => {
                console.log("SendInterchainTokenModal onChange", chain);
                setToChain(chain);
              }}
            />
          </div>
        }
        body={
          <div className="grid gap-1">
            <StyledLabel htmlFor="amount">Amount</StyledLabel>
            <StyledInput
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        }
        disabled={isLoading}
        confirmDisabled={isModalConfirmDisable}
        confirmButtonTitle={confirmButtonTitle}
        buttonTitle={
          <div className="flex items-center justify-center gap-2">
            {isLoading && <Oval width={16} height={16} color={"white"} />}
            {sendStatusTxtMap[sendTxState.type]}
          </div>
        }
        onConfirm={handleConfirm}
      />
    );
  };

  const renderWalletSwitchButton = () => {
    if (currentMMChain?.id === props.fromNetworkId) return null;

    return (
      <button
        onClick={switchWallet}
        className="w-full text-blue-700 bg-transparent border border-blue-500 rounded btn btn-default btn-rounded hover:bg-blue-500 hover:text-white hover:border-transparent"
      >
        Switch to {props.fromNetworkName}
      </button>
    );
  };

  return (
    <div className="mb-5 grid gap-2">
      {renderWalletSwitchButton()}
      {renderModalButton()}
      {balance.data && (
        <div className="flex items-center justify-between">
          <StyledLabel>Balance: {balance?.data}</StyledLabel>
          {sendTxState.type === "sending" && (
            <a
              href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/gmp/${sendTxState.txHash}`}
              className="flex items-center gap-1 hover:text-blue-500 hover:underline"
              rel="noreferrer noopener"
              target="_blank"
            >
              axelarscan <HiExternalLink />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default SendInterchainTokenModal;

import { FC, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils.js";
import tw from "tailwind-styled-components";
import { useAccount, useMutation, useNetwork, useQuery, useSigner, useSwitchNetwork } from "wagmi";
import { ChainData } from "web3modal";

import Chains from "~/components/interchain-token/chains";
import Modal from "~/components/modal";
import { useERC20 } from "~/lib/contract/hooks/useERC20";
import { useInterchainTokenLinker } from "~/lib/contract/hooks/useInterchainTokenLinker";
import { toArray } from "~/lib/utils";
import { EvmChainsData } from "~/interface/evm_chains";
import { AxelarQueryAPI, Environment, GasToken } from "@axelar-network/axelarjs-sdk";
import { getWagmiChains } from "~/lib/providers/WagmiConfigProvider";

export const SAMPLE_TOKEN = "0x5425890298aed601595a70AB815c96711a31Bc65";

export const gasTokenMap: Record<string, GasToken> = {
  "avalanche": GasToken.AVAX,
  "ethereum-2": GasToken.ETH,
  "ethereum": GasToken.ETH,
  "moonbeam": GasToken.GLMR,
  "fantom": GasToken.FTM,
  "polygon": GasToken.MATIC,
  "aurora": GasToken.AURORA,
  "binance": GasToken.BINANCE,
  "celo": GasToken.CELO,
  "kava": GasToken.KAVA
}

function ChainPicker(props: {
  value: string;
  // eslint-disable-next-line no-unused-vars
  onChange?: (chain: EvmChainsData) => void;
}) {
  // @ts-ignore
  const {evm_chains_data} = useSelector(
    // @ts-ignore
    ( {evm_chains} ) => evm_chains
  );
  return (
    <Chains
      chain={props.value}
      onSelect={(c: {}) => {
        const chainData = toArray(evm_chains_data).find((_c) => _c.id === c);
        chainData && props.onChange?.(chainData);
      }}
      displayName={true}
    />
  );
}

export function useTokenBalance(tokenAddress: string) {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const erc20 = useERC20({
    address: tokenAddress,
    signerOrProvider: signer,
  });

  return useQuery(
    ["tokenBalance", tokenAddress],
    async () => {
      if (!(erc20 && address)) return;

      const balance = await erc20.balanceOf(address);
      return formatUnits(balance, 18);
    },
    {
      enabled: !!address && !!signer && !!erc20,
    }
  );
}

export function useSendInterchainTokenMutation(config: {
  tokenAddress: `0x${string}`;
  tokenId: `0x${string}`;
}) {
  const signer = useSigner();
  const erc20 = useERC20({
    address: config.tokenAddress,
    signerOrProvider: signer.data,
  });

  const { address, isConnected, status } = useAccount();

  const tokenLinker = useInterchainTokenLinker({
    address: String(process.env.NEXT_PUBLIC_TOKEN_LINKER_ADDRESS),
    signerOrProvider: signer.data,
  });

  return useMutation(
    async (input: {
      tokenAddress: `0x${string}`;
      tokenId: `0x${string}`;
      toNetwork: string;
      fromNetwork: string;
      amount: string;
    }) => {
      if (!(erc20 && address && tokenLinker)) {
        console.log("useMutation SendInterchainTokenModal: return erc20", erc20);
        console.log("useMutation SendInterchainTokenModal: return address", address);
        console.log("useMutation SendInterchainTokenModal: return tokenLInker", tokenLinker);
        return;
      }

      const {tokenAddress, tokenId, toNetwork, amount, fromNetwork} = input;
      console.log("params",tokenAddress, tokenId, toNetwork, amount, fromNetwork)      
      const decimals = await erc20.decimals();
      const bn = BigNumber.from(parseUnits(input.amount, decimals));

      console.log("decimals",decimals);
      console.log("amount",formatUnits(bn, decimals));

      console.log("environment",process.env.NEXT_PUBLIC_ENVIRONMENT);
      const environment = process.env.NEXT_PUBLIC_ENVIRONMENT as Environment;
      const axelarQueryAPI = new AxelarQueryAPI({ environment });
      const gas = await axelarQueryAPI.estimateGasFee(fromNetwork, toNetwork, gasTokenMap[fromNetwork.toLowerCase()]);
      console.log("gas",gas);
      console.log("fromNetwork",fromNetwork);

      //approve
      const tx = await erc20.approve(tokenLinker.address, bn);

      // wait for tx to be mined
      await tx.wait(1);

      //send token
      const sendTokenTx = await tokenLinker.sendToken(
        input.tokenId,
        input.toNetwork,
        address,
        bn,
        { value: BigNumber.from(gas) }
      );
      return await sendTokenTx.wait(1);
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
  text-slate-400 dark:text-slate-500 text-sm\
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


  const { chain: currentMMChain } = useNetwork()

  const [amount, setAmount] = useState<string>("");
  const [toChain, setToChain] = useState<EvmChainsData | null>(null);

  const { switchNetwork } = useSwitchNetwork({
    onSuccess(data) {
      console.log("Success", data);
      
    },
  });

  const handleConfirm = useCallback(async () => {

    if (currentMMChain?.id !== props.fromNetworkId) {
      await switchNetwork?.(getWagmiChains().find(t => t.id === props.fromNetworkId)?.id);
      return;
    }

    if (!toChain || !amount) {
      console.log("SendInterchainTokenModal toChain or amount not specified", toChain, amount);
      return;
    };

    await sendToken({
      tokenAddress: props.tokenAddress,
      tokenId: props.tokenId,
      toNetwork: toChain.chain_name,
      fromNetwork: props.fromNetworkName,
      amount
    });
  }, [props.tokenAddress, props.tokenId, props.fromNetworkId, sendToken, amount, toChain]);

  return (
    <div className="mb-5">
      <Modal
        tooltip={false}
        title={
          <div className="flex items-center gap-2">
            <div>Send Interchain Token to</div>
            <ChainPicker
              value={toChain?.chain_name || ""}
              onChange={(chain) => {
                console.log("SendInterchainTokenModal onChange",chain);
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
        buttonTitle={currentMMChain?.id === props.fromNetworkId ? "Send token cross-chain" : `Switch wallet to ${props.fromNetworkName}`}
        buttonClassName={currentMMChain?.id !== props.fromNetworkId ? "w-full btn btn-default btn-rounded bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded" : ""}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default SendInterchainTokenModal;

"btn btn-default btn-rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
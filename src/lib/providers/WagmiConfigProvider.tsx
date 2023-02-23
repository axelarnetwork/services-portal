import { FC, PropsWithChildren } from "react";
import { WagmiConfig, configureChains, createClient } from "wagmi";
import {
  mainnet,
  goerli,
  moonbeam,
  avalanche,
  avalancheFuji,
  polygon,
  polygonMumbai,
  bsc,
  bscTestnet,
  arbitrum,
  arbitrumGoerli,
} from "wagmi/chains";
import { InjectedConnector } from "wagmi/connectors/injected";
import { publicProvider } from "wagmi/providers/public";

const chainConfigs = [
  { ...mainnet, networkNameOnAxelar: "ethereum", environment: "mainnet" },
  { ...goerli, networkNameOnAxelar: "ethereum-2", environment: "testnet" },
  { ...moonbeam, networkNameOnAxelar: "moonbeam", environment: "testnet" },
  { ...avalanche, networkNameOnAxelar: "avalanche", environment: "mainnet" },
  {
    ...avalancheFuji,
    networkNameOnAxelar: "avalanche",
    environment: "testnet",
  },
  { ...polygon, networkNameOnAxelar: "polygon", environment: "mainnet" },
  { ...polygonMumbai, networkNameOnAxelar: "polygon", environment: "testnet" },
  { ...bsc, networkNameOnAxelar: "binance", environment: "mainnet" },
  { ...bscTestnet, networkNameOnAxelar: "binance", environment: "testnet" },
  { ...arbitrum, networkNameOnAxelar: "arbitrum", environment: "mainnet" },
  {
    ...arbitrumGoerli,
    networkNameOnAxelar: "arbitrum",
    environment: "testnet",
  },
];

export const getWagmiChains = () => chainConfigs;

const { webSocketProvider, provider } = configureChains(chainConfigs, [
  publicProvider(),
]);

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
  connectors: [new InjectedConnector()],
});

const WagmiConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};

export default WagmiConfigProvider;

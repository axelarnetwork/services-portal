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
  celo,
  celoAlfajores,
  aurora,
  auroraTestnet,
  optimism,
  optimismGoerli,
  moonbaseAlpha,
  fantom,
  fantomTestnet,
} from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { publicProvider } from "wagmi/providers/public";

const chainConfigs = [
  { ...mainnet, networkNameOnAxelar: "ethereum", environment: "mainnet" },
  { ...goerli, networkNameOnAxelar: "ethereum-2", environment: "testnet" },
  { ...moonbeam, networkNameOnAxelar: "moonbeam", environment: "mainnet" },
  { ...moonbaseAlpha, networkNameOnAxelar: "moonbeam", environment: "testnet" },
  { ...fantom, networkNameOnAxelar: "fantom", environment: "mainnet" },
  { ...fantomTestnet, networkNameOnAxelar: "fantom", environment: "testnet" },
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
  { ...celo, networkNameOnAxelar: "celo", environment: "mainnet" },
  { ...celoAlfajores, networkNameOnAxelar: "celo", environment: "testnet" },
  { ...aurora, networkNameOnAxelar: "aurora", environment: "mainnet" },
  { ...auroraTestnet, networkNameOnAxelar: "aurora", environment: "testnet" },
  { ...optimism, networkNameOnAxelar: "optimism", environment: "mainnet" },
  {
    ...optimismGoerli,
    networkNameOnAxelar: "optimism",
    environment: "testnet",
  },
  {
    id: 2222,
    name: "Kava EVM",
    network: "kava",
    networkNameOnAxelar: "kava",
    environment: "mainnet",
    nativeCurrency: {
      name: "KAVA",
      symbol: "KAVA",
      decimals: 18,
    },
    blockExplorers: {
      default: {
        name: "Kava Explorer",
        url: "https://explorer.kava.io/",
      },
    },
    rpcUrls: {
      default: { http: ["https://evm.kava.io"] },
      public: { http: ["https://evm.kava.io"] },
    },
    testnet: false,
  },
  {
    id: 2221,
    name: "Kava EVM Testnet",
    network: "kava",
    networkNameOnAxelar: "kava",
    environment: "testnet",
    nativeCurrency: {
      name: "KAVA",
      symbol: "KAVA",
      decimals: 18,
    },
    blockExplorers: {
      default: {
        name: "Kava EVM Explorer",
        url: "https://explorer.evm-alpha.kava.io/",
      },
    },
    rpcUrls: {
      default: { http: ["https://evm.testnet.kava.io"] },
      public: { http: ["https://evm.testnet.kava.io"] },
    },
    testnet: true,
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
  connectors: [
    new MetaMaskConnector({
      chains: chainConfigs,
      options: {
        shimDisconnect: false,
        shimChainChangedDisconnect: false,
      },
    }),
  ],
});

const WagmiConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};

export default WagmiConfigProvider;

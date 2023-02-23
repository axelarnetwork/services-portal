import { FC, PropsWithChildren } from "react";
import { getDefaultProvider } from "ethers";
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
];

const { webSocketProvider, provider } = configureChains(chainConfigs, [publicProvider()]);

// const providersss = configureChains(chainConfigs, [publicProvider()]);

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

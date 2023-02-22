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
import { publicProvider } from "wagmi/providers/public";

const chains = [
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

const { provider, webSocketProvider } = configureChains(chains, [
  publicProvider(),
]);

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
});

const WagmiConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};

export default WagmiConfigProvider;

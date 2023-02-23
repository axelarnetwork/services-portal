import { useContract, UseContractConfig } from "wagmi";

import contract from "../abis/LinkerRouterProxy";

type Config = Omit<UseContractConfig<typeof contract.abi>, "abi">;

export function useLinkerRouterProxy(config: Config) {
  if (!config.address) throw new Error("address is required");

  return useContract({
    abi: contract.abi,
    ...config,
  });
}

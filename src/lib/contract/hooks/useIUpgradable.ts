import { useContract, UseContractConfig } from "wagmi";

import contract from "../abis/IUpgradable";

type Config = Omit<UseContractConfig<typeof contract.abi>, "abi">;

export function useIUpgradable(config: Config) {
  if (!config.address) throw new Error("address is required");

  return useContract({
    abi: contract.abi,
    ...config,
  });
}

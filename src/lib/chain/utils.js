import { providers, utils } from "ethers";

export const getChain = (id, data) =>
  id &&
  Array.isArray(data) &&
  data.find((d) => [d?.id, d?.chain_name, d?.chain_id].includes(id));

export const switchChain = async (chain_id, provider, evm_chains_data) => {
  if (chain_id && provider) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: utils.hexValue(chain_id) }],
      });
    } catch (error) {
      const { code } = { ...error };

      if (code === 4902) {
        try {
          const { provider_params } = {
            ...getChain(chain_id, evm_chains_data),
          };

          await provider.request({
            method: "wallet_addEthereumChain",
            params: provider_params,
          });
        } catch (error) {
          return;
        }
      } else {
        return;
      }
    }

    const signer = new providers.Web3Provider(provider).getSigner();

    signer.address = await signer.getAddress();

    return signer;
  }
};

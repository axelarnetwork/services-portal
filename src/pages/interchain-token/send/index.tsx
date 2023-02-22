import WagmiConfigProvider from "~/lib/providers/WagmiConfigProvider";

const SendInterchainTokenPage = () => {
  return (
    <WagmiConfigProvider>
      <h1 className="text-2xl">Send Interchain Token</h1>
    </WagmiConfigProvider>
  );
};

export default SendInterchainTokenPage;

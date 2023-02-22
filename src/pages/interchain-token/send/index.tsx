import Modal from "~/components/modal";
import WagmiConfigProvider from "~/lib/providers/WagmiConfigProvider";

const SendInterchainTokenPage = () => {
  return (
    <WagmiConfigProvider>
      <Modal
        tooltip={false}
        title="Send Interchain Token"
        body={
          <div>
            <p>Send Interchain Token</p>
          </div>
        }
        buttonTitle="Send Interchain Token"
      />
    </WagmiConfigProvider>
  );
};

export default SendInterchainTokenPage;

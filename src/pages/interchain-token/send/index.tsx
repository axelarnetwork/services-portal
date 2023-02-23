import { useAccount, useConnect, useEnsName, useNetwork } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

import Modal from "~/components/modal";
import { useERC20 } from "~/lib/contract/hooks/useERC20";

// it(`Should send some token from origin to destination`, async() => {
//   const origin = chains[0];
//   const destination = chains[1];
//   const amount = 1e6;

//   await (await origin.tok.mint(wallet.address, amount)).wait();
//   await (await origin.tok.approve(origin.tl.address, amount)).wait();

//   const tokenId = await origin.tl.getOriginTokenId(origin.token);
//   await (await origin.tl.sendToken(tokenId, destination.name, wallet.address, amount, {value: 1e6})).wait();
//   await new Promise((resolve) => {
//       setTimeout(() => {
//           resolve();
//       }, 500);
//   });
//   const tokenAddr = await destination.tl.getTokenAddress(tokenId)
//   const token = new Contract(tokenAddr, IERC20.abi, destination.walletConnected);
//   expect(Number(await token.balanceOf(wallet.address))).to.equal(amount);
// });

const SAMPLE_TOKEN = "0x5425890298aed601595a70AB815c96711a31Bc65";

function Profile() {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  if (isConnected) return <div>Connected to {ensName ?? address}</div>;
  return (
    <button
      className="btn btn-default btn-rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
      onClick={() => connect()}
    >
      Connect Wallet
    </button>
  );
}

const SendInterchainTokenPage = () => {
  const erc20 = useERC20({
    address: SAMPLE_TOKEN,
  });

  console.log({ erc20 });

  const { chains, chain } = useNetwork();

  console.log({ chains, chain });

  return (
    <>
      <Profile />
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
    </>
  );
};

export default SendInterchainTokenPage;

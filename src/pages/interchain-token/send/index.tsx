import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { useCallback, useEffect } from "react";
import { useAccount, useConnect, useEnsName, useNetwork, useSigner } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

import Modal from "~/components/modal";
import { useERC20 } from "~/lib/contract/hooks/useERC20";
import { useInterchainTokenLinker } from "~/lib/contract/hooks/useInterchainTokenLinker";

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
      className="text-white bg-blue-500 btn btn-default btn-rounded hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
      onClick={() => connect()}
    >
      Connect Wallet
    </button>
  );
}

const SendInterchainTokenPage = () => {
  const { address } = useAccount();
  const signer = useSigner();
  const erc20 = useERC20({
    address: SAMPLE_TOKEN,
    signerOrProvider: signer.data
  });

  const tl = useInterchainTokenLinker({
    address: String(process.env.NEXT_PUBLIC_TOKEN_LINKER_ADDRESS),
    signerOrProvider: signer.data
  });

  console.log("SendInterchainTokenPage - erc20",{ erc20 });
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

  const getBal = useCallback(async () => {
    if (!erc20 || !address || !tl) return;
    const balance = await erc20.balanceOf(address);

    const amount = BigNumber.from(100_000);
    
    //approve
    const tx = await erc20.approve(tl.address, amount);
    const tx2 = await tx.wait(1);
    console.log("tx2",tx2);

    
    const tokenId = await tl.getOriginTokenId(SAMPLE_TOKEN);
    console.log("balance",formatUnits(balance, 6), tokenId);

    //send token
    const tx3 = await (await tl.sendToken(tokenId, "Polygon", address, amount, {value: 3e6})).wait();
    console.log("tx3",tx3);

    
  }, [erc20, address])

  const { chains, chain } = useNetwork();

  console.log("SendInterchainTokenPage chains",{ chains, chain });

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
        onConfirm={getBal}
      />
    </>
  );
};

export default SendInterchainTokenPage;

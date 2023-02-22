import InterchainToken from "~/components/interchain-token";

export const InterChainTokenPage = () => {
  return (
    <div className="mx-auto mt-2 mb-8">
      <InterchainToken />
      <div className="grid-cols-2 grid-cols-3 grid-cols-4" />
    </div>
  );
};

export default InterChainTokenPage;

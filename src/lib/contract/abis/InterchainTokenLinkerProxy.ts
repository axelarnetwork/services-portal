export default <const>{
  _format: "hh-sol-artifact-1",
  contractName: "InterchainTokenLinkerProxy",
  sourceName: "contracts/proxies/InterchainTokenLinkerProxy.sol",
  abi: [
    {
      inputs: [],
      name: "AlreadyInitialized",
      type: "error",
    },
    {
      inputs: [],
      name: "EtherNotAccepted",
      type: "error",
    },
    {
      inputs: [],
      name: "InvalidImplementation",
      type: "error",
    },
    {
      inputs: [],
      name: "NotOwner",
      type: "error",
    },
    {
      inputs: [],
      name: "SetupFailed",
      type: "error",
    },
    {
      stateMutability: "payable",
      type: "fallback",
    },
    {
      inputs: [],
      name: "implementation",
      outputs: [
        {
          internalType: "address",
          name: "implementation_",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "implementationAddress",
          type: "address",
        },
        {
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
        {
          internalType: "bytes",
          name: "params",
          type: "bytes",
        },
      ],
      name: "init",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "data",
          type: "bytes",
        },
      ],
      name: "setup",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      stateMutability: "payable",
      type: "receive",
    },
  ],
  bytecode:
    "0x608060405234801561001057600080fd5b50337f02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040c055610677806100436000396000f3fe6080604052600436106100385760003560e01c8063378dfd8e146100bf5780635c60da1b146100e15780639ded06df1461012c5761006f565b3661006f576040517f3733483400000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60006100997f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b90503660008037600080366000845af43d6000803e8080156100ba573d6000f35b3d6000fd5b3480156100cb57600080fd5b506100df6100da366004610465565b61014b565b005b3480156100ed57600080fd5b507f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040516001600160a01b03909116815260200160405180910390f35b34801561013857600080fd5b506100df610147366004610537565b5050565b7f02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040c054336001600160a01b038216146101af576040517f30cd747100000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60006101d97f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b6001600160a01b031614610219576040517f0dc149f000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f6ec6af55bf1e5f27006bfa01248d73e8894ba06f23f8002b047607ff2b1944ba846001600160a01b0316638291286c6040518163ffffffff1660e01b815260040160206040518083038186803b15801561027357600080fd5b505afa158015610287573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102ab91906105a9565b146102e2576040517f68155f9a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b837f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc55827f02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040c0556000846001600160a01b0316639ded06df8460405160240161034a91906105f2565b6040516020818303038152906040529060e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040516103989190610625565b600060405180830381855af49150503d80600081146103d3576040519150601f19603f3d011682016040523d82523d6000602084013e6103d8565b606091505b5050905080610413576040517f97905dfb00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5050505050565b80356001600160a01b038116811461043157600080fd5b919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60008060006060848603121561047a57600080fd5b6104838461041a565b92506104916020850161041a565b9150604084013567ffffffffffffffff808211156104ae57600080fd5b818601915086601f8301126104c257600080fd5b8135818111156104d4576104d4610436565b604051601f8201601f19908116603f011681019083821181831017156104fc576104fc610436565b8160405282815289602084870101111561051557600080fd5b8260208601602083013760006020848301015280955050505050509250925092565b6000806020838503121561054a57600080fd5b823567ffffffffffffffff8082111561056257600080fd5b818501915085601f83011261057657600080fd5b81358181111561058557600080fd5b86602082850101111561059757600080fd5b60209290920196919550909350505050565b6000602082840312156105bb57600080fd5b5051919050565b60005b838110156105dd5781810151838201526020016105c5565b838111156105ec576000848401525b50505050565b60208152600082518060208401526106118160408501602087016105c2565b601f01601f19169190910160400192915050565b600082516106378184602087016105c2565b919091019291505056fea2646970667358221220f1dbce1fb0489120f22743781aef592e6abb90569857ae5badc6a3657038087464736f6c63430008090033",
  deployedBytecode:
    "0x6080604052600436106100385760003560e01c8063378dfd8e146100bf5780635c60da1b146100e15780639ded06df1461012c5761006f565b3661006f576040517f3733483400000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60006100997f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b90503660008037600080366000845af43d6000803e8080156100ba573d6000f35b3d6000fd5b3480156100cb57600080fd5b506100df6100da366004610465565b61014b565b005b3480156100ed57600080fd5b507f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040516001600160a01b03909116815260200160405180910390f35b34801561013857600080fd5b506100df610147366004610537565b5050565b7f02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040c054336001600160a01b038216146101af576040517f30cd747100000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60006101d97f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b6001600160a01b031614610219576040517f0dc149f000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f6ec6af55bf1e5f27006bfa01248d73e8894ba06f23f8002b047607ff2b1944ba846001600160a01b0316638291286c6040518163ffffffff1660e01b815260040160206040518083038186803b15801561027357600080fd5b505afa158015610287573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102ab91906105a9565b146102e2576040517f68155f9a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b837f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc55827f02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040c0556000846001600160a01b0316639ded06df8460405160240161034a91906105f2565b6040516020818303038152906040529060e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040516103989190610625565b600060405180830381855af49150503d80600081146103d3576040519150601f19603f3d011682016040523d82523d6000602084013e6103d8565b606091505b5050905080610413576040517f97905dfb00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5050505050565b80356001600160a01b038116811461043157600080fd5b919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60008060006060848603121561047a57600080fd5b6104838461041a565b92506104916020850161041a565b9150604084013567ffffffffffffffff808211156104ae57600080fd5b818601915086601f8301126104c257600080fd5b8135818111156104d4576104d4610436565b604051601f8201601f19908116603f011681019083821181831017156104fc576104fc610436565b8160405282815289602084870101111561051557600080fd5b8260208601602083013760006020848301015280955050505050509250925092565b6000806020838503121561054a57600080fd5b823567ffffffffffffffff8082111561056257600080fd5b818501915085601f83011261057657600080fd5b81358181111561058557600080fd5b86602082850101111561059757600080fd5b60209290920196919550909350505050565b6000602082840312156105bb57600080fd5b5051919050565b60005b838110156105dd5781810151838201526020016105c5565b838111156105ec576000848401525b50505050565b60208152600082518060208401526106118160408501602087016105c2565b601f01601f19169190910160400192915050565b600082516106378184602087016105c2565b919091019291505056fea2646970667358221220f1dbce1fb0489120f22743781aef592e6abb90569857ae5badc6a3657038087464736f6c63430008090033",
  linkReferences: {},
  deployedLinkReferences: {},
};
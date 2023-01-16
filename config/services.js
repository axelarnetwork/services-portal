export default (
  [
    {
      id: 'interchain-token',
      title: 'Interchain Token',
      path: '/interchain-token',
      others_paths:
        [],
      description: 'Easily deploy your own cross-chain-enabled ERC-20 token.',
      image: '/images/ogimage.png',
      tags:
        [
          'Crosschain Token',
          'Token Linker',
          'Cross Chain',
        ],
      navbar_visible: true,
      coming_soon: true,
    },
    {
      id: 'gmp-express',
      title: 'GMP Express',
      path: '/gmp-express',
      others_paths:
        [],
      description: `Axelar's GMP Express is our fastest GMP offering. Full end-to-end GMP messages can sometimes take many minutes because they must wait for full finality and network resolution, but with GMP Express, you can take advantage of faster message delivery with integrated support for Axelar token bridging.`,
      image: '/images/ogimage.png',
      tags:
        [
          'GMP',
          'GMP Express',
          'Cross Chain',
        ],
      navbar_visible: true,
      coming_soon: true,
    },
  ]
  .filter(s =>
    s?.path
  )
)
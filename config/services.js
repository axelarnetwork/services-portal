export default (
  [
    {
      id: 'interchain-token',
      title: 'Interchain Token',
      path: '/interchain-token',
      others_paths:
        [],
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      image: '/images/ogimage.png',
      tags:
        [
          'Tag 1',
          'Tag 2',
          'Tag 3',
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
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      image: '/images/ogimage.png',
      tags:
        [
          'Tag 1',
          'Tag 2',
          'Tag 3',
        ],
      navbar_visible: true,
      coming_soon: true,
    },
  ]
  .filter(s =>
    s?.path
  )
)
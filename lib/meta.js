import _ from 'lodash'

import { name } from './utils'

export default (
  path,
  data,
) => {
  path =
    !path ?
      '/' :
      path.toLowerCase()

  path =
    path.includes('?') ?
      path
        .substring(
          0,
          path.indexOf('?'),
        ) :
      path

  const _paths =
    path
      .split('/')
      .filter(x => x)

  const title =
    `${
      _.reverse(
        _.cloneDeep(_paths)
      )
      .map(x =>
        name(
          x,
          data,
        )
      )
      .join(' - ')
    }${
      _paths.length > 0 ?
        ` | ${process.env.NEXT_PUBLIC_APP_NAME}` :
        process.env.NEXT_PUBLIC_DEFAULT_TITLE
    }`
  const description = process.env.NEXT_PUBLIC_DEFAULT_DESCRIPTION
  const image = `${process.env.NEXT_PUBLIC_SITE_URL}/images/ogimage.png`
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}${path}`

  return {
    title,
    description,
    url,
    image,
  }
}
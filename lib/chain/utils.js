export const get_chain = (
  id,
  data,
) =>
  id &&
  Array.isArray(data) &&
  data
    .find(d =>
      [
        d?.id,
        d?.chain_name,
        d?.chain_id,
      ]
      .includes(id)
    )

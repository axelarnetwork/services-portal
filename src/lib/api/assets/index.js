const _module = "assets";

const request = async (path, params) => {
  params = {
    ...params,
    path,
    module: _module,
  };

  const response = await fetch(process.env.NEXT_PUBLIC_EXPLORER_API_URL, {
    method: "POST",
    body: JSON.stringify(params),
  }).catch(() => {
    return null;
  });

  return response && (await response.json());
};

export const getAssetsPrice = async (params) => await request(null, params);

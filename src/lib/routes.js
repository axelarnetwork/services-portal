import _ from "lodash";

import services from "../config/services";

export const routes = _.concat(
  [{ pathname: "/" }],
  services.flatMap((s) => {
    const { path, others_paths } = { ...s };

    return _.concat(path, others_paths)
      .filter((p) => p)
      .map((p) => {
        return {
          pathname: p,
        };
      });
  })
);

export const isRouteExist = (pathname) =>
  routes.findIndex((r, i) => {
    if (r.pathname === pathname) {
      return true;
    }

    if (
      r.pathname.split("/").filter((p) => p).length ===
      pathname.split("/").filter((p) => p).length
    ) {
      const route_paths = r.pathname.split("/").filter((p) => p);

      const paths = pathname.split("/").filter((p) => p);

      return !(
        route_paths.findIndex(
          (p, j) => !(p.startsWith("[") && p.endsWith("]")) && p !== paths[j]
        ) > -1
      );
    }

    return false;
  }) > -1;

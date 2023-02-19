import _ from "lodash";

import { split } from "./utils";
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
    if (r.pathname === pathname) return true;

    const route_paths = split(r.pathname, "lower", "/");
    const paths = split(pathname, "lower", "/");

    if (route_paths.length === paths.length) {
      return (
        route_paths.findIndex(
          (p, j) => !(p.startsWith("[") && p.endsWith("]")) && p !== paths[j]
        ) < 0
      );
    }

    return false;
  }) > -1;

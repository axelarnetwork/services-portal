import _ from "lodash";

import services from "../config/services";
import { split, name } from "./utils";

export default (path, data, pathname) => {
  path = path ? path.toLowerCase() : "/";
  path = path.includes("?") ? path.substring(0, path.indexOf("?")) : path;

  const _paths = split(path, "normal", "/");

  let title = `${_.reverse(_.cloneDeep(_paths))
    .filter((x) => !(x?.startsWith("[") && x.endsWith("]")))
    .map((x) => name(x, data))
    .join(" - ")}${
    _paths.length > 0
      ? ` | ${process.env.NEXT_PUBLIC_APP_NAME}`
      : process.env.NEXT_PUBLIC_DEFAULT_TITLE
  }`;

  let description = process.env.NEXT_PUBLIC_DEFAULT_DESCRIPTION;
  let image = `${process.env.NEXT_PUBLIC_SITE_URL}/images/ogimage.png`;
  let url = `${process.env.NEXT_PUBLIC_SITE_URL}${path}`;

  const service = services.find(
    (s) => s?.path === path || s?.others_paths?.includes(pathname)
  );

  if (service) {
    if (service.title) {
      title = service.title;
    }

    if (service.description) {
      description = service.description;
    }

    if (service.image) {
      image = service.image;
    }

    if (service.others_paths?.includes(path)) {
      url = `${process.env.NEXT_PUBLIC_SITE_URL}${service.path}`;
    }
  }

  return {
    title,
    description,
    url,
    image,
  };
};

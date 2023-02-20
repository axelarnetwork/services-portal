import _ from "lodash";

import services from "~/config/services";

export default _.concat(
  [
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/",
      others_paths: [],
    },
  ],
  services.filter((s) => s?.navbar_visible)
).filter((m) => m?.path);

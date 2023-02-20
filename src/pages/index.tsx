import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import Dashboard from "~/components/dashboard";
import { isRouteExist } from "~/lib/routes";

const IndexPage = () => {
  const router = useRouter();
  const { pathname, asPath } = { ...router };

  const _asPath = asPath.includes("?")
    ? asPath.substring(0, asPath.indexOf("?"))
    : asPath;

  const [ssr, setSsr] = useState(true);

  useEffect(() => {
    setSsr(false);
  }, []);

  if (!ssr && typeof window !== "undefined" && pathname !== _asPath) {
    router.push(isRouteExist(_asPath) ? asPath : "/");
  }

  return (
    !ssr && (
      <div className="max-w-8xl mx-auto mt-2 mb-8">
        <Dashboard />
      </div>
    )
  );
};

export default IndexPage;

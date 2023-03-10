import { FC, useEffect } from "react";
import TagManager from "react-gtm-module";
import { Provider } from "react-redux";
import { AppProps } from "next/app";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";

import Layout from "~/layouts";
import * as ga from "~/lib/ga";
import WagmiConfigProvider from "~/lib/providers/WagmiConfigProvider";
import { useStore } from "~/store";

import "~/styles/animate.css";
import "~/styles/components/button.css";
import "~/styles/components/dropdown.css";
import "~/styles/components/forms.css";
import "~/styles/components/modals.css";
import "~/styles/components/navbar.css";
import "~/styles/components/notifications.css";
import "~/styles/components/nprogress.css";
import "~/styles/components/skeleton.css";
import "~/styles/components/table.css";
import "~/styles/globals.css";
import "~/styles/layout.css";
import "~/styles/tailwind.css";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const store = useStore(pageProps.initialReduxState);

  useEffect(() => {
    const handleRouteChange = (url: string) => ga.pageview(url);

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GTM_ID) {
      TagManager.initialize({ gtmId: process.env.NEXT_PUBLIC_GTM_ID });
    }
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.png" />
        <meta name="msapplication-TileColor" content="#050707" />
        <meta
          name="msapplication-TileImage"
          content="/icons/mstile-150x150.png"
        />
        <meta name="theme-color" content="#050707" />
      </Head>
      <Provider store={store}>
        <WagmiConfigProvider>
          <Layout>
            <div id="portal" />
            <Component {...pageProps} />
          </Layout>
        </WagmiConfigProvider>
      </Provider>
    </>
  );
};

export default App;

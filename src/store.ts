import { useMemo } from "react";
import { composeWithDevTools } from "@redux-devtools/extension";
import { createStore } from "@reduxjs/toolkit";
import { applyMiddleware, Store } from "redux";

import reducers from "./reducers";

let store: Store | undefined;

type PreloadedState = Record<string, unknown>;

const initStore = (preloadedState: PreloadedState) =>
  createStore(reducers, preloadedState, composeWithDevTools(applyMiddleware()));

export const initializeStore = (preloadedState: PreloadedState) => {
  let _store = store ?? initStore(preloadedState);

  // After navigating to a page with an initial Redux state, merge that state
  // with the current state in the store, and create a new store
  if (preloadedState && store) {
    _store = initStore({
      ...store.getState(),
      ...preloadedState,
    });

    // Reset the current store
    store = undefined;
  }

  // For SSG and SSR always create a new store
  if (typeof window === "undefined") {
    return _store;
  }

  // Create the store once in the client
  if (!store) {
    store = _store;
  }

  return _store;
};

export const useStore = (initialState: PreloadedState) => {
  const store = useMemo(() => initializeStore(initialState), [initialState]);

  return store;
};

import { useState, useEffect } from "react";
import { useSelector, shallowEqual } from "react-redux";
import Link from "next/link";
import _ from "lodash";
import moment from "moment";

const GMPExpress = () => {
  const { preferences, evm_chains, cosmos_chains, assets } = useSelector(
    (state) => ({
      preferences: state.preferences,
      evm_chains: state.evm_chains,
      cosmos_chains: state.cosmos_chains,
      assets: state.assets,
    }),
    shallowEqual
  );
  const { theme } = { ...preferences };
  const { evm_chains_data } = { ...evm_chains };
  const { cosmos_chains_data } = { ...cosmos_chains };
  const { assets_data } = { ...assets };

  return <div className="space-y-8" />;
};

export default GMPExpress;

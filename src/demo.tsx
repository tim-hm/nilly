import React, { useEffect, useState } from "react";
import { args } from "./config";
import {
  ClusterDescriptor,
  Days,
  NadaValues,
  Operation,
  PriceQuote,
} from "@nillion/core";
import { NillionClient } from "@nillion/client";

export function Demo() {
  const [clusterInfo, setClusterInfo] = useState<ClusterDescriptor>();
  const [quote, setQuote] = useState<PriceQuote>();

  const run = async () => {
    if (window.__NILLION?.initialized) return;

    const client = NillionClient.create();
    await client.connect(args);
    const clusterInfoResult = await client.fetchClusterInfo();
    if (clusterInfoResult.err) {
      console.log(clusterInfoResult.err);
    } else {
      setClusterInfo(clusterInfoResult.ok!);
    }

    const quoteResult = await client.fetchOperationQuote({
      operation: Operation.storeValues({
        values: NadaValues.create(),
        ttl: Days.parse(1),
      }),
    });
    if (quoteResult.err) {
      console.log(quoteResult.err);
    } else {
      setQuote(quoteResult.ok!);
    }
  };

  useEffect(
    () =>
      void run()
        .then(() => console.log("Run finished."))
        .catch((e) => {
          console.error("Caught error: ", e.message);
          console.error(e);
        }),
    [],
  );

  return (
    <div>
      <h2>Cluster info</h2>
      <p>{clusterInfo ? JSON.stringify(clusterInfo) : "Loading..."}</p>
      <h2>Quote for store integer secret</h2>
      <p>{quote ? JSON.stringify(quote) : "Loading..."}</p>
    </div>
  );
}

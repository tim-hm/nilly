import { Operation, NadaValue, NadaValues } from "@nillion/client-web";
import React, { useRef, useState } from "react";
import useAsyncEffect from "use-async-effect";
import { connect, pay } from "./nillion";

export function DoNillionStuff() {
  const initCalled = useRef(false);
  const [result, setResult] = useState<any>();

  useAsyncEffect(async () => {
    if (initCalled.current) return;

    initCalled.current = true;
    const context = await connect();

    const secretName = "foo";
    const secrets = new NadaValues();
    secrets.insert(secretName, NadaValue.new_public_unsigned_integer("42"));
    const storeOperation = Operation.store_values(secrets, 1);

    const storeQuote = await context.vm.client.request_price_quote(
      context.config.clusterId,
      storeOperation,
    );

    console.log("quote: ", JSON.stringify(storeQuote));

    const storeReceipt = await pay(context, storeOperation);
    console.log("receipt: ", JSON.stringify(storeReceipt));

    const storeId = await context.vm.client.store_values(
      context.config.clusterId,
      secrets,
      undefined,
      storeReceipt,
    );

    console.log("commit: ", storeId);

    const writeResult = {
      storeQuote,
      storeReceipt,
      storeId,
    };

    const retrieveOperation = Operation.retrieve_value();
    const retrieveQuote = await context.vm.client.request_price_quote(
      context.config.clusterId,
      retrieveOperation,
    );
    console.log("quote: ", JSON.stringify(retrieveQuote));

    const retrieveReceipt = await pay(context, retrieveOperation);
    console.log("receipt: ", JSON.stringify(retrieveReceipt));

    const secret = await context.vm.client.retrieve_value(
      context.config.clusterId,
      storeId,
      secretName,
      retrieveReceipt,
    );

    console.log("secret: ", secret.to_integer());

    const retrieveResult = {
      retrieveQuote,
      retrieveReceipt,
      secret: secret.to_integer(),
    };

    const result = {
      writeResult,
      retrieveResult,
    };

    setResult(result);
  }, []);

  if (!result) {
    return (
      <div>
        <h2>Loading ...</h2>
      </div>
    );
  }

  return (
    <div>
      <h2>Nillion client loaded</h2>
      <p>{JSON.stringify(result)}</p>
    </div>
  );
}

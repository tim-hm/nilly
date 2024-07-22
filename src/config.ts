import { createSignerFromKey } from "@nillion/payments";
import { ConnectionArgs, PrivateKeyBase16 } from "@nillion/client";

// for use local nillion-devnet
export const args = {
  bootnodes: [
    "/ip4/127.0.0.1/tcp/14211/ws/p2p/12D3KooWCAGu6gqDrkDWWcFnjsT9Y8rUzUH8buWjdFcU3TfWRmuN",
  ],
  clusterId: "e2c959ca-ecb2-45b0-8f2b-d91abbfa3708",
  userSeed: "nillion-testnet-seed-1",
  nodeSeed: "nillion-testnet-seed-1",
  // payments
  endpoint: "http://localhost:8080/nilchain",
  signerOrCreateFn: () =>
    createSignerFromKey(
      PrivateKeyBase16.parse(
        "5c98e049ceca4e2c342516e1b81c689e779da9dbae64ea6b92d52684a92095e6",
      ),
    ),
} as ConnectionArgs;

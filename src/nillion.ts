import { DirectSecp256k1Wallet, Registry } from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import init, {
  Operation,
  PaymentReceipt,
  UserKey,
  NodeKey,
  NillionClient,
} from "@nillion/client-web";
import { MsgPayFor, typeUrl } from "@nillion/client-web/proto";

export interface Config {
  clusterId: string;
  bootnodes: string[];
  vm: {
    nodeKey: "seed";
  };
  chain: {
    endpoint: string;
    keys: string[];
  };
}

export const config: Config = {
  clusterId: "9e68173f-9c23-4acc-ba81-4f079b639964",
  bootnodes: [
    "/ip4/127.0.0.1/tcp/54936/ws/p2p/12D3KooWMvw1hEqm7EWSDEyqTb6pNetUVkepahKY6hixuAuMZfJS",
  ],
  chain: {
    endpoint: "http://127.0.0.1:48102",
    keys: ["9a975f567428d054f2bf3092812e6c42f901ce07d9711bc77ee2cd81101f42c5"],
  },
  vm: {
    nodeKey: "seed",
  },
};

export interface Context {
  config: Config;
  vm: {
    client: NillionClient;
  };
  chain: {
    client: SigningStargateClient;
    wallet: DirectSecp256k1Wallet;
  };
}

export async function connect(): Promise<Context> {
  await init();

  const userKey = UserKey.generate();
  const nodeKey = NodeKey.from_seed(config.vm.nodeKey);
  const nilVmClient = new NillionClient(userKey, nodeKey, config.bootnodes);
  const [nilChainClient, nilChainWallet] = await createNilChainClient(config);

  return {
    config,
    vm: {
      client: nilVmClient,
    },
    chain: {
      client: nilChainClient,
      wallet: nilChainWallet,
    },
  };
}

export async function createNilChainClient(
  config: Config,
): Promise<[SigningStargateClient, DirectSecp256k1Wallet]> {
  const key = Uint8Array.from(
    config.chain.keys[0].match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  const wallet = await DirectSecp256k1Wallet.fromKey(key, "nillion");

  const registry = new Registry();
  registry.register(typeUrl, MsgPayFor);

  const options = {
    registry,
    gasPrice: GasPrice.fromString("25unil"),
    gasAdjustment: 1.3,
    autoGas: true,
  };

  const client = await SigningStargateClient.connectWithSigner(
    config.chain.endpoint,
    wallet,
    options,
  );

  return [client, wallet];
}

export async function pay(
  context: Context,
  operation: Operation,
): Promise<PaymentReceipt> {
  const { client: nilVmClient } = context.vm;
  const { client: nilChainClient, wallet } = context.chain;

  const quote = await nilVmClient.request_price_quote(
    context.config.clusterId,
    operation,
  );

  const denom = "unil";
  const [account] = await wallet.getAccounts();
  const from = account.address;

  const payload: MsgPayFor = {
    fromAddress: from,
    resource: quote.nonce,
    amount: [{ denom, amount: quote.cost.total }],
  };

  const result = await context.chain.client.signAndBroadcast(
    from,
    [{ typeUrl, value: payload }],
    "auto",
  );

  return new PaymentReceipt(quote, result.transactionHash);
}

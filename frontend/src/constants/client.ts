import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export const client = createPublicClient({
  chain: baseSepolia,
  transport: http(import.meta.env.VITE_BASE_TESTNET_RPC_URL),
});

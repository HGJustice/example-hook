import { createPublicClient, createWalletClient, http, custom } from "viem";
import { baseSepolia } from "viem/chains";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const client = createPublicClient({
  chain: baseSepolia,
  transport: http(import.meta.env.VITE_BASE_TESTNET_RPC_URL),
});

export const baseWalletClient = createWalletClient({
  chain: baseSepolia,
  transport: custom(window.ethereum),
});

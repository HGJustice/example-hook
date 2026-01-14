import type { PoolKey } from "@uniswap/v4-sdk";

export type PoolConfig = {
  rpc: {
    mainnet: string;
    local: string;
  };
  poolKey: PoolKey;
  sqrtPriceX96: string;
};

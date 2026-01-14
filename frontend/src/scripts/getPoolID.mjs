import { Pool } from "@uniswap/v4-sdk";
import { Token } from "@uniswap/sdk-core";

export const ETH_TOKEN = new Token(
  84532,
  "0x0000000000000000000000000000000000000000",
  18,
  "ETH",
  "Ether"
);

export const EXAMPLE_TOKEN = new Token(
  84532,
  "0xCC04941338f101EF09623E3BE0e1d5545e3cab8a",
  18,
  "EXA",
  "Example"
);

const poolId32 = Pool.getPoolId(
  ETH_TOKEN,
  EXAMPLE_TOKEN,
  3000,
  60,
  "0x238a9DdAbcf2AE2449979F196107d3AeAE31C040"
);

// Truncate from bytes32 to bytes25 (remove last 7 bytes / 14 hex chars)
const poolId25 = poolId32.slice(0, 52); // '0x' + 50 hex chars = 25 bytes

console.log("The PoolID (bytes32):", poolId32);
console.log("The PoolID (bytes25):", poolId25);

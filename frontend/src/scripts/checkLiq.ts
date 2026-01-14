import { client } from "../constants/clients.ts";
import {
  poolManagerAddress,
  tokenAddress,
  hookAddress,
} from "../constants/contractAddresses.ts";
import type { PoolKey } from "@uniswap/v4-sdk";
import PoolManagerABI from "../ABI/poolManager.json" assert { type: "json" };

async function checkPoolExists() {
  const poolKey: PoolKey = {
    currency0: "0x0000000000000000000000000000000000000000",
    currency1: tokenAddress,
    fee: Number(3000),
    tickSpacing: Number(60),
    hooks: hookAddress,
  };
  try {
    // Get the pool ID
    const poolId = await client.readContract({
      address: poolManagerAddress as `0x${string}`,
      abi: PoolManagerABI,
      functionName: "getPoolId",
      args: [poolKey],
    });

    console.log("Pool ID:", poolId);

    // Get slot0 - this contains sqrtPriceX96, tick, etc.
    const slot0Result = (await client.readContract({
      address: poolManagerAddress as `0x${string}`,
      abi: PoolManagerABI,
      functionName: "getSlot0",
      args: [poolId],
    })) as [bigint, number, bigint, bigint];

    console.log("Slot0:", slot0Result);

    const slot0 = slot0Result as [bigint, number, bigint, bigint];

    const sqrtPriceX96Current = slot0[0];
    const currentTick = slot0[1];

    console.log("Current sqrtPriceX96:", sqrtPriceX96Current.toString());
    console.log("Current tick:", currentTick);
  } catch (error) {
    console.error("Error checking pool:", error);
  }
}
checkPoolExists();

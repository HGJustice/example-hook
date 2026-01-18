import { Pool } from "@uniswap/v4-sdk";
import type { PoolKey } from "@uniswap/v4-sdk";
import { Token, ChainId, Ether } from "@uniswap/sdk-core";
import { baseWalletClient, client } from "../constants/clients";
import {
  poolManagerAddress,
  hookAddress,
  tokenAddress,
  ethAddress,
  stateViewAddress,
} from "../constants/contractAddresses";
import PoolManagerABI from "../ABI/poolManager.json";
import StateViewABI from "../ABI/stateView.json";

export async function initializePool(
  currency1: string,
  fee: number,
  tickSpacing: number,
  hooks: string
): Promise<string> {
  try {
    const poolKey: PoolKey = {
      currency0: ethAddress,
      currency1,
      fee,
      tickSpacing,
      hooks,
    };

    const sqrtPriceX96 = BigInt("79228162514264337593543950336");
    const [userAddress] = await baseWalletClient.requestAddresses();

    const poolDataTx = await baseWalletClient.writeContract({
      address: poolManagerAddress,
      abi: PoolManagerABI,
      functionName: "initialize",
      args: [poolKey, sqrtPriceX96],
      account: userAddress,
    });

    return poolDataTx;
  } catch (error) {
    console.error("Error in the submitPoolData function", error);
    throw error;
  }
}

export async function getPoolState(): Promise<[bigint, number, bigint]> {
  try {
    const ETH_NATIVE = Ether.onChain(ChainId.BASE_SEPOLIA);

    const EXAMPLE_TOKEN = new Token(84532, tokenAddress, 18, "EXA", "Example");

    const poolID = Pool.getPoolId(
      ETH_NATIVE,
      EXAMPLE_TOKEN,
      3000,
      60,
      hookAddress
    );

    const [slot0Result, liquidityResult] = await Promise.all([
      client.readContract({
        address: stateViewAddress,
        abi: StateViewABI,
        functionName: "getSlot0",
        args: [poolID],
      }),
      client.readContract({
        address: stateViewAddress,
        abi: StateViewABI,
        functionName: "getLiquidity",
        args: [poolID],
      }),
    ]);

    const slot0 = slot0Result as [bigint, number, bigint, bigint];
    const currentLiquidity = liquidityResult as bigint;
    const sqrtPriceX96Current = slot0[0];
    const currentTick = slot0[1];

    return [sqrtPriceX96Current, currentTick, currentLiquidity];
  } catch (error) {
    console.error("Error in the getPoolData function:", error);
    throw error;
  }
}

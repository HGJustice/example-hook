import { Token, ChainId, Ether, Percent } from "@uniswap/sdk-core";
import { nearestUsableTick } from "@uniswap/v3-sdk";
import { Pool, Position, V4PositionManager } from "@uniswap/v4-sdk";
import type { MintOptions } from "@uniswap/v4-sdk";
import { getPoolState } from "./poolFunctions";
import {
  tokenAddress,
  hookAddress,
  positionManagerAddress,
} from "../constants/contractAddresses";
import { client, baseWalletClient } from "../constants/clients";
import PositionManagerABI from "../ABI/positionManager.json";

export async function createMintPosition(
  amountA: number,
  amountB: number,
  tickRange: number = 1000,
  fullRange: boolean = false,
  slippageTolerance: number = 0.05
): Promise<string> {
  const ETH_NATIVE = Ether.onChain(ChainId.BASE_SEPOLIA);
  const EXAMPLE_TOKEN = new Token(84532, tokenAddress, 18, "EXA", "Example");
  const fee = 3000;
  const tickSpacing = 60;

  try {
    const [sqrtPrice, currentTick, liquidity] = await getPoolState();
    const pool = new Pool(
      ETH_NATIVE,
      EXAMPLE_TOKEN,
      fee,
      tickSpacing,
      hookAddress,
      sqrtPrice.toString(),
      liquidity.toString(),
      currentTick
    );

    let tickLower: number;
    let tickUpper: number;

    if (fullRange) {
      const MIN_TICK = -887272;
      const MAX_TICK = 887272;

      const poolTickSpacing = pool.tickSpacing;

      tickLower = nearestUsableTick(MIN_TICK, poolTickSpacing);

      tickUpper = nearestUsableTick(MAX_TICK, poolTickSpacing);
    } else {
      tickLower = nearestUsableTick(currentTick - tickRange, tickSpacing);
      tickUpper = nearestUsableTick(currentTick + tickRange, tickSpacing);
    }

    const token0IsETH = ETH_NATIVE.wrapped.sortsBefore(EXAMPLE_TOKEN);

    const amount0Desired = token0IsETH
      ? Math.floor(amountA * 10 ** ETH_NATIVE.decimals)
      : Math.floor(amountB * 10 ** EXAMPLE_TOKEN.decimals);

    const amount1Desired = token0IsETH
      ? Math.floor(amountB * 10 ** EXAMPLE_TOKEN.decimals)
      : Math.floor(amountA * 10 ** ETH_NATIVE.decimals);

    const position = Position.fromAmounts({
      pool,
      tickLower,
      tickUpper,
      amount0: amount0Desired,
      amount1: amount1Desired,
      useFullPrecision: true,
    });

    const slippagePct = new Percent(
      Math.floor(slippageTolerance * 100),
      10_000
    );

    const [userAddress] = await baseWalletClient.requestAddresses();
    const deadlineSeconds = 20 * 60; // 20 minutes
    const currentBlock = await client.getBlock();
    const currentBlockTimestamp = Number(currentBlock.timestamp);
    const deadline = currentBlockTimestamp + deadlineSeconds;

    const mintOptions: MintOptions = {
      recipient: userAddress,
      slippageTolerance: slippagePct,
      deadline: deadline.toString(),
      useNative: ETH_NATIVE,
      hookData: "0x",
    };

    const { calldata, value } = V4PositionManager.addCallParameters(
      position,
      mintOptions
    );

    const txHash = await baseWalletClient.writeContract({
      address: positionManagerAddress,
      abi: PositionManagerABI,
      functionName: "multicall",
      args: [[calldata]],
      value: BigInt(value),
      account: userAddress,
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
    });

    return receipt.transactionHash;
  } catch (error) {
    console.error("Error in the createPosition function", error);
    throw error;
  }
}

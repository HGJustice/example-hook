import { Token, ChainId, Ether, Percent } from "@uniswap/sdk-core";
import { nearestUsableTick } from "@uniswap/v3-sdk";
import { Pool, Position, V4PositionManager } from "@uniswap/v4-sdk";
import type { MintOptions } from "@uniswap/v4-sdk";
import { getPoolState } from "./poolFunctions";
import {
  tokenAddress,
  hookAddress,
  positionManagerAddress,
  permit2Address,
} from "../constants/contractAddresses";
import { client, baseWalletClient } from "../constants/clients";
import { PERMIT2_TYPES } from "../types/permit2";
import PositionManagerABI from "../ABI/positionManager.json";
import Premit2ABI from "../ABI/premit2.json";

export async function createMintPosition(
  amountA: number,
  amountB: number,
  tickRange: number = 1000,
  fullRange: boolean = false,
  slippageTolerance: number = 0.05,
): Promise<string> {
  const ETH_NATIVE = Ether.onChain(ChainId.BASE_SEPOLIA);
  const EXAMPLE_TOKEN = new Token(84532, tokenAddress, 18, "EXA", "Example");
  const fee = 3000;
  const tickSpacing = 60;

  try {
    const [sqrtPrice, currentTick, liquidity] = await getPoolState();
    console.log("Pool State:", {
      sqrtPrice: sqrtPrice.toString(),
      currentTick,
      liquidity: liquidity.toString(),
    });
    const pool = new Pool(
      ETH_NATIVE,
      EXAMPLE_TOKEN,
      fee,
      tickSpacing,
      hookAddress,
      sqrtPrice.toString(),
      liquidity.toString(),
      currentTick,
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

    console.log("Tick Info:", {
      currentTick,
      tickLower,
      tickUpper,
      tickSpacing,
    });

    const token0IsETH = ETH_NATIVE.wrapped.sortsBefore(EXAMPLE_TOKEN);

    const amount0Desired = token0IsETH
      ? BigInt(Math.floor(amountA * 1e18)).toString()
      : (
          BigInt(Math.floor(amountB)) * BigInt(10 ** EXAMPLE_TOKEN.decimals)
        ).toString();

    const amount1Desired = token0IsETH
      ? (
          BigInt(Math.floor(amountB)) * BigInt(10 ** EXAMPLE_TOKEN.decimals)
        ).toString()
      : BigInt(Math.floor(amountA * 1e18)).toString();

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
      10_000,
    );

    const [userAddress] = await baseWalletClient.requestAddresses();
    const deadlineSeconds = 20 * 60;
    const currentBlock = await client.getBlock();
    const currentBlockTimestamp = Number(currentBlock.timestamp);
    const deadline = currentBlockTimestamp + deadlineSeconds;

    const permitDetails = [];

    const [, , nonce] = (await client.readContract({
      address: permit2Address,
      abi: Premit2ABI,
      functionName: "allowance",
      args: [userAddress, tokenAddress, positionManagerAddress],
    })) as [bigint, number, number];

    const permitExpiration = currentBlockTimestamp + 1800;

    permitDetails.push({
      token: tokenAddress,
      amount: (2n ** 160n - 1n).toString(),
      expiration: permitExpiration.toString(),
      nonce: nonce.toString(),
    });

    const permitBatch = {
      details: permitDetails,
      spender: positionManagerAddress,
      sigDeadline: deadline.toString(),
    };

    const signature = await baseWalletClient.signTypedData({
      account: userAddress,
      domain: {
        name: "Permit2",
        chainId: ChainId.BASE_SEPOLIA,
        verifyingContract: permit2Address,
      },
      types: PERMIT2_TYPES,
      primaryType: "PermitBatch",
      message: permitBatch,
    });

    const mintOptions: MintOptions = {
      recipient: userAddress,
      slippageTolerance: slippagePct,
      deadline: deadline.toString(),
      useNative: ETH_NATIVE,
      hookData: "0x",
      batchPermit: {
        owner: userAddress,
        permitBatch: permitBatch,
        signature: signature,
      },
    };

    const { calldata, value } = V4PositionManager.addCallParameters(
      position,
      mintOptions,
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

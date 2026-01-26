import { encodeAbiParameters } from "viem";
import { Actions, V4Planner } from "@uniswap/v4-sdk";
import type { SwapExactInSingle } from "@uniswap/v4-sdk";
import { CommandType, RoutePlanner } from "@uniswap/universal-router-sdk";
import { baseWalletClient, client } from "../constants/clients";
import {
  universalRouterAddress,
  tokenAddress,
  hookAddress,
  permit2Address,
} from "../constants/contractAddresses";
import UniversalRouterABI from "../ABI/universalRouter.json";
import ExampleTokenABI from "../ABI/businessToken.json";
import Premit2ABI from "../ABI/premit2.json";

export async function performSwap(
  ethAmount: string,
  tokenAmount: string,
): Promise<string> {
  const zeroForOne = ethAmount !== "" && ethAmount !== "0";
  const amount = zeroForOne ? ethAmount : tokenAmount;

  try {
    const [userAddress] = await baseWalletClient.requestAddresses();

    const encodedHookData = encodeAbiParameters(
      [{ type: "address" }],
      [userAddress],
    );

    console.log("hook data = ", encodedHookData);

    const deadline = Math.floor(Date.now() / 1000) + 3600;

    // Only approve for Token → ETH swaps
    if (!zeroForOne) {
      console.log("Approving tokens...");

      // Step 1: Approve Permit2 to spend your tokens
      const approveExampleToken = await baseWalletClient.writeContract({
        address: tokenAddress,
        abi: ExampleTokenABI,
        functionName: "approve",
        args: [
          permit2Address,
          BigInt(
            "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          ),
        ],
        account: userAddress,
      });

      console.log("Example token approve hash:", approveExampleToken);

      // Wait for confirmation
      await client.waitForTransactionReceipt({
        hash: approveExampleToken,
      });
      console.log("Example token approval confirmed");

      // Step 2: Approve Universal Router on Permit2
      const maxUint160 = BigInt(2) ** BigInt(160) - BigInt(1);

      const approvePermit2 = await baseWalletClient.writeContract({
        address: permit2Address,
        abi: Premit2ABI,
        functionName: "approve",
        args: [
          tokenAddress,
          universalRouterAddress,
          maxUint160,
          BigInt(deadline + 86400 * 30), // 30 days expiration
        ],
        account: userAddress,
      });

      // Wait for confirmation
      await client.waitForTransactionReceipt({ hash: approvePermit2 });
      console.log("Permit2 approval confirmed");
    }

    const CurrentConfig: SwapExactInSingle = {
      poolKey: {
        currency0: "0x0000000000000000000000000000000000000000",
        currency1: tokenAddress,
        fee: 3000,
        tickSpacing: 60,
        hooks: hookAddress,
      },
      zeroForOne,
      amountIn: BigInt(parseFloat(amount) * 1e18).toString(),
      amountOutMinimum: "0",
      hookData: encodedHookData,
    };

    const v4Planner = new V4Planner();
    const routePlanner = new RoutePlanner();

    v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [CurrentConfig]);

    if (zeroForOne) {
      // ETH → Token
      v4Planner.addAction(Actions.SETTLE_ALL, [
        CurrentConfig.poolKey.currency0,
        CurrentConfig.amountIn,
      ]);
      v4Planner.addAction(Actions.TAKE_ALL, [
        CurrentConfig.poolKey.currency1,
        CurrentConfig.amountOutMinimum,
      ]);
    } else {
      // Token → ETH
      v4Planner.addAction(Actions.SETTLE_ALL, [
        CurrentConfig.poolKey.currency1,
        CurrentConfig.amountIn,
      ]);
      v4Planner.addAction(Actions.TAKE_ALL, [
        CurrentConfig.poolKey.currency0,
        CurrentConfig.amountOutMinimum,
      ]);
    }

    const encodedActions = v4Planner.finalize();

    routePlanner.addCommand(CommandType.V4_SWAP, [
      v4Planner.actions,
      v4Planner.params,
    ]);

    console.log("Executing swap...");

    const tx = await baseWalletClient.writeContract({
      address: universalRouterAddress,
      abi: UniversalRouterABI,
      functionName: "execute",
      args: [routePlanner.commands, [encodedActions], BigInt(deadline)],
      account: userAddress,
      value: zeroForOne ? BigInt(CurrentConfig.amountIn) : 0n,
    });

    console.log("Swap transaction hash:", tx);

    // Wait for swap to be mined
    await client.waitForTransactionReceipt({ hash: tx });
    console.log("Swap confirmed!");

    return tx;
  } catch (error) {
    console.log("Error in submitSwap function", error);
    throw error;
  }
}

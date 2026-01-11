import { createPublicClient, http, keccak256, encodePacked } from "viem";
import { baseSepolia } from "viem/chains";

const poolManagerAddress =
  "0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408" as `0x${string}`;
const tokenAddress =
  "0xCC04941338f101EF09623E3BE0e1d5545e3cab8a" as `0x${string}`;
const hookAddress =
  "0x238a9DdAbcf2AE2449979F196107d3AeAE31C040" as `0x${string}`;

const RPC_URL = "https://base-sepolia.g.alchemy.com/v2/cL9LxL_eBoAP0RQLWdaGx";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

async function checkPool() {
  const poolKey = {
    currency0: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    currency1: tokenAddress,
    fee: 3000,
    tickSpacing: 60,
    hooks: hookAddress,
  };

  const poolId = keccak256(
    encodePacked(
      ["address", "address", "uint24", "int24", "address"],
      [
        poolKey.currency0,
        poolKey.currency1,
        poolKey.fee,
        poolKey.tickSpacing,
        poolKey.hooks,
      ]
    )
  );

  console.log("Pool ID:", poolId);

  try {
    // Try getSlot0 instead - this checks if pool is initialized
    const slot0 = await client.readContract({
      address: poolManagerAddress,
      abi: [
        {
          inputs: [{ name: "id", type: "bytes32" }],
          name: "getSlot0",
          outputs: [
            { name: "sqrtPriceX96", type: "uint160" },
            { name: "tick", type: "int24" },
            { name: "protocolFee", type: "uint24" },
            { name: "lpFee", type: "uint24" },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "getSlot0",
      args: [poolId],
    });

    console.log("Pool Slot0:", slot0);
    console.log("sqrtPriceX96:", slot0[0].toString());
    console.log("Current tick:", slot0[1].toString());

    if (slot0[0] === 0n) {
      console.log(
        "❌ Pool NOT initialized! You need to call initialize() first."
      );
    } else {
      console.log("✅ Pool is initialized!");
    }
  } catch (error: any) {
    if (error.message.includes("reverted")) {
      console.log("❌ Pool does NOT exist or was never initialized!");
      console.log("\n📝 You need to:");
      console.log("1. Call initialize() on the PoolManager");
      console.log("2. Then add liquidity with modifyLiquidity()");
      console.log("3. Then you can swap");
    } else {
      console.error("Error:", error.message);
    }
  }
}

checkPool();

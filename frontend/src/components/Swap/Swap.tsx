import { useState } from "react";
import { encodeAbiParameters } from "viem";
import { Actions, V4Planner } from "@uniswap/v4-sdk";
import type { SwapExactInSingle } from "@uniswap/v4-sdk";
import { CommandType, RoutePlanner } from "@uniswap/universal-router-sdk";
import { baseWalletClient, client } from "../../constants/clients";
import { performSwap } from "../../lib/swapFunctions";
import {
  universalRouterAddress,
  tokenAddress,
  hookAddress,
  permit2Address,
} from "../../constants/contractAddresses";
import UniversalRouterABI from "../../ABI/universalRouter.json";
import ExampleTokenABI from "../../ABI/businessToken.json";
import Premit2ABI from "../../ABI/premit2.json";

function Swap() {
  const [ethAmount, setEthAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [hookData, setHookData] = useState("");

  async function submitSwap(event: React.FormEvent) {
    event.preventDefault();
    try {
      const tx = await performSwap(ethAmount, tokenAmount);
      console.log(tx);
    } catch (error) {
      console.error("Error happend in the submitSwap function", error);
    }
  }

  return (
    <>
      <h1>Swap</h1>
      <form onSubmit={submitSwap}>
        <div>
          <label>ETH</label>
          <input
            type="number"
            name="currency0"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="Enter ETH amount to swap"
          />
          <label>Example Token</label>
          <input
            type="number"
            name="currency1"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="Enter Token amount to swap"
          />
          <label>Hook Data</label>
          <input
            type="text"
            name="hookData"
            value={hookData}
            placeholder="0x.."
            onChange={(e) => setHookData(e.target.value)}
          />
        </div>
        <button type="submit">Swap</button>
      </form>
    </>
  );
}

export default Swap;

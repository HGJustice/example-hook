import type { ModifyLiquidityFormData } from "../../types/forms/modifyLiquidityFormData";
import { createMintPosition } from "../../lib/modifyLiquidityFunctions";
import { userFormInput } from "../../hooks/userFormInput";

function ModifyLiquidity() {
  const { formData, handleInputChange, resetForm } =
    userFormInput<ModifyLiquidityFormData>({
      amount0: 0,
      amount1: 0,
    });

  async function submitModifyLiquidityRequest(event: React.FormEvent) {
    event.preventDefault();

    try {
      const txHash = await createMintPosition(
        formData.amount0,
        formData.amount1
      );
      console.log(txHash);
    } catch (error) {
      console.error(
        "Error happending in the submitModifyLiquidityRequest function:",
        error
      );
    }
  }

  return (
    <>
      <h1>Modify Liquidity</h1>
      <form onSubmit={submitModifyLiquidityRequest}>
        <div>
          <label>Amount 0</label>
          <input
            type="number"
            name="amount0"
            placeholder="Amount 0"
            value={formData.amount0}
            onChange={handleInputChange}
          />
          <label>Amount 1</label>
          <input
            type="number"
            name="amount1"
            placeholder="Amount 1"
            value={formData.amount1}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Add or remove liquidity</button>
        <button type="button" onClick={resetForm}>
          Clear Form
        </button>
      </form>
    </>
  );
}

export default ModifyLiquidity;

export type ModifyLiquidityParams = {
  tickLower: number;
  tickUpper: number;
  liquidityDelta: bigint;
  salt: string;
};

// lib/currency.ts

// You can adjust these rates later or fetch them from an API
const CNY_TO_USD = 0.14;
const USD_TO_BDT = 121;

// Your profit multipliers based on cost
function getMultiplier(costBdt: number): number {
  if (costBdt < 500) return 1.5;
  if (costBdt < 2000) return 1.35;
  if (costBdt < 5000) return 1.25;
  if (costBdt < 10000) return 1.18;
  return 1.12;
}

export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatUSD(amount: number): string {
  return `$${(amount / USD_TO_BDT).toFixed(2)}`;
}

// Calculates the final selling price in BDT based on the 1688 CNY price
export function calculateSellingPrice(cnyPrice: number): number {
  if (cnyPrice <= 0) return 0;
  
  const costBdt = cnyPrice * CNY_TO_USD * USD_TO_BDT;
  const multiplier = getMultiplier(costBdt);
  const sellingRaw = costBdt * multiplier;
  
  // Round to nearest 10 BDT
  return Math.max(20, Math.round(sellingRaw / 10) * 10);
}
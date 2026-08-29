import type { Currency } from "@/types/database";

export function formatCurrency(amount: number, currency: Currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatOdds(odds: number) {
  return odds.toFixed(2);
}

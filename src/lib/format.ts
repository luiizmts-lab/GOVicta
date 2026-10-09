const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value));
}

export function formatNumber(value: number | string) {
  return numberFormatter.format(Number(value));
}

export function formatPercent(value: number | string) {
  return `${percentFormatter.format(Number(value))}%`;
}

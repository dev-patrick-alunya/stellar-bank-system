export function formatKES(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(v);
}

export function maskAccount(num: string) {
  if (!num) return "";
  if (num.length <= 4) return num;
  return "*".repeat(num.length - 4) + num.slice(-4);
}

export function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

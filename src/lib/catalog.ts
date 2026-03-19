// ── Biozentra Product Catalog ────────────────────────────────────────────────
// Single source of truth for predefined products and their prices.
// Used in Products, Stock, and Orders pages.

export interface CatalogItem {
  name: string;
  price: number;
}

export const CATALOG: CatalogItem[] = [
  { name: "IvyZen",      price: 229.50 },
  { name: "MiltivitZen", price: 263.50 },
  { name: "KalZen",      price: 272.00 },
];

export const CATALOG_MAP: Record<string, number> = Object.fromEntries(
  CATALOG.map((c) => [c.name, c.price])
);

/** Returns all catalog names + any extra names not already in the catalog */
export function mergedProductNames(extraNames: string[]): string[] {
  const catalogNames = CATALOG.map((c) => c.name);
  const extras = extraNames.filter((n) => !(n in CATALOG_MAP));
  return [...catalogNames, ...extras];
}

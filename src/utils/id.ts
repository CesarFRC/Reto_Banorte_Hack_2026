/**
 * Generates short unique IDs with a prefix
 * Example: generateId('card') → "card_a1b2c3d4"
 */
export function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}_${id}`;
}

/**
 * Generates a realistic-looking Visa card number
 * Example: "4915 8832 7741 3029"
 */
export function generateCardNumber(): string {
  const prefix = '4915';
  const groups = [prefix];
  for (let g = 0; g < 3; g++) {
    let group = '';
    for (let i = 0; i < 4; i++) {
      group += Math.floor(Math.random() * 10).toString();
    }
    groups.push(group);
  }
  return groups.join(' ');
}

/**
 * Generates a 3-digit CVV
 */
export function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

/**
 * Generates a Banorte-style folio
 * Example: "BNT-20260912-A7X3K"
 */
export function generateFolio(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BNT-${date}-${suffix}`;
}

/**
 * Generates a realistic CLABE (18 digits)
 */
export function generateCLABE(): string {
  // Banorte prefix: 072
  let clabe = '072140';
  for (let i = 0; i < 12; i++) {
    clabe += Math.floor(Math.random() * 10).toString();
  }
  return clabe;
}

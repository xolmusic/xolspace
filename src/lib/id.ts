import { customAlphabet } from "nanoid";

// Identifiant court, sans caracteres ambigus, pour nommer les objets R2.
const nano = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  24
);

export function createId() {
  return nano();
}

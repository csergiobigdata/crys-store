/** Valida um CPF pelo algoritmo oficial de dígitos verificadores (módulo 11). */
export function isValidCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map(Number);

  for (const checkIndex of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < checkIndex; i++) {
      sum += digits[i] * (checkIndex + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    const expected = remainder === 10 ? 0 : remainder;
    if (expected !== digits[checkIndex]) {
      return false;
    }
  }

  return true;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

import { describe, expect, it } from "vitest";
import { getDisplayName } from "@/lib/auth/display-name";

describe("getDisplayName", () => {
  it("usa o apelido quando existe, para qualquer perfil", () => {
    expect(getDisplayName({ fullName: "Maria Souza", nickname: "Mari", role: "cliente" })).toBe("Mari");
    expect(getDisplayName({ fullName: null, nickname: "Chefe", role: "admin" })).toBe("Chefe");
  });

  it("administrador sem apelido vira 'Administrador'", () => {
    expect(getDisplayName({ fullName: "Carlos Sergio", nickname: null, role: "admin" })).toBe("Administrador");
    expect(getDisplayName({ fullName: null, nickname: "  ", role: "admin" })).toBe("Administrador");
  });

  it("cliente sem apelido mostra só o primeiro nome quando há sobrenome", () => {
    expect(getDisplayName({ fullName: "Maria Aparecida Souza", nickname: null, role: "cliente" })).toBe("Maria");
  });

  it("cliente com nome de uma palavra mostra até 10 letras", () => {
    expect(getDisplayName({ fullName: "Bartolomeu-Fernandes", nickname: null, role: "cliente" })).toBe("Bartolomeu");
    expect(getDisplayName({ fullName: "Ana", nickname: null, role: "cliente" })).toBe("Ana");
  });

  it("sem nome nem apelido cai em 'Conta'", () => {
    expect(getDisplayName({ fullName: null, nickname: null, role: "cliente" })).toBe("Conta");
  });
});

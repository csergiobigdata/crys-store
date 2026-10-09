export type DisplayNameSource = {
  fullName: string | null;
  nickname: string | null;
  role: "cliente" | "admin";
};

/**
 * Nome mostrado no botão do menu da conta.
 * - Com apelido cadastrado: o apelido (vale para qualquer usuário).
 * - Administrador sem apelido: "Administrador".
 * - Cliente sem apelido: o primeiro nome, se o nome tiver sobrenome; se for
 *   uma palavra só, as 10 primeiras letras.
 */
export function getDisplayName(user: DisplayNameSource): string {
  const nickname = user.nickname?.trim();
  if (nickname) return nickname;

  if (user.role === "admin") return "Administrador";

  const fullName = user.fullName?.trim();
  if (!fullName) return "Conta";

  const [firstName, ...rest] = fullName.split(/\s+/);
  return rest.length > 0 ? firstName : firstName.slice(0, 10);
}

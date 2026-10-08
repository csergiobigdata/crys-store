import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getCompanyInfo } from "@/lib/legal/company-info";

const legalLinks = [
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/politica-de-trocas-e-devolucoes", label: "Trocas e Devoluções" },
  { href: "/politica-de-entrega", label: "Política de Entrega" },
];

/**
 * Dados da empresa vêm de app_settings (chave "company_info"), editável
 * pelo admin em /admin/configuracoes sem redeploy. CNPJ/CPF e endereço NÃO
 * são exibidos no site por enquanto (a empresa ainda será aberta e a loja é
 * virtual): enquanto esses campos estiverem vazios, nenhuma página os mostra.
 */
export async function Footer() {
  const company = await getCompanyInfo();
  const razaoSocial = company.razao_social || "[REVISAR] razão social não configurada";
  const contato = company.contato || "[REVISAR] contato não configurado";

  return (
    <footer className="mt-24 bg-gradient-to-br from-rose-dark to-rose text-white/90">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo tone="light" />
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Acessórios selecionados com cuidado, para o seu dia a dia e para
              ocasiões especiais.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Institucional</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Atendimento</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>{contato}</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Dados da empresa
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>{razaoSocial}</li>
              <li>Loja virtual — atendimento somente online.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/20 pt-6 text-xs text-white/75 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Chrys Store. Todos os direitos
            reservados.
          </p>
          <p>Direito de arrependimento de 7 dias (CDC)</p>
        </div>
      </div>
    </footer>
  );
}

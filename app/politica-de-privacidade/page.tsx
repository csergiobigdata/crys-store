import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { formatCompanyLine, getCompanyInfo } from "@/lib/legal/company-info";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default async function PrivacyPolicyPage() {
  const company = await getCompanyInfo();
  const razaoSocial = formatCompanyLine(company, "razao_social", "a razão social");
  const cnpjOuCpf = company.cnpj_ou_cpf?.trim(); // só aparece quando preenchido
  const contato = formatCompanyLine(company, "contato", "o contato");

  return (
    <LegalLayout title="Política de Privacidade" updatedAt="06 de outubro de 2026">
      <p>
        Esta política explica como a Chrys Store ({" "}
        <strong>{razaoSocial}</strong>
        {cnpjOuCpf && (
          <>
            , <strong>{cnpjOuCpf}</strong>
          </>
        )}
        ) coleta,
        usa e protege seus dados pessoais, em conformidade com a Lei Geral
        de Proteção de Dados (LGPD, Lei nº 13.709/2018).
      </p>

      <h2>1. Quais dados coletamos</h2>
      <p>Coletamos apenas o necessário para processar seu pedido:</p>
      <ul>
        <li>Nome, CPF, e-mail e telefone, para identificação e nota fiscal [REVISAR].</li>
        <li>Endereço de entrega, para o envio do pedido.</li>
        <li>
          Histórico de pedidos e status de pagamento (nunca o número do
          cartão, CVV ou validade — isso é tratado diretamente pelo
          Mercado Pago, sem passar pelos nossos servidores).
        </li>
        <li>
          Comprovante de pagamento Pix, quando enviado por você, guardado
          em área de acesso restrito.
        </li>
        <li>E-mail e senha, se você criar uma conta (a senha é gerenciada pelo Supabase Auth, nunca em texto puro).</li>
      </ul>

      <h2>2. Para que usamos seus dados</h2>
      <ul>
        <li>Processar e entregar seu pedido.</li>
        <li>Comunicar sobre o status do pedido (criado, pago, enviado).</li>
        <li>Cumprir obrigações legais e fiscais.</li>
        <li>Prevenir fraudes nos pagamentos.</li>
      </ul>
      <p>
        Não vendemos seus dados a terceiros e não os usamos para
        publicidade de terceiros.
      </p>

      <h2>3. Com quem compartilhamos dados</h2>
      <p>Usamos os seguintes prestadores de serviço, só para o necessário:</p>
      <ul>
        <li><strong>Supabase</strong> — banco de dados, autenticação e armazenamento de arquivos.</li>
        <li><strong>Mercado Pago</strong> — processamento de pagamentos com cartão.</li>
        <li><strong>Resend</strong> — envio de e-mails transacionais (confirmação de pedido, etc.).</li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        Usamos apenas cookies essenciais, necessários para manter seu
        carrinho e sua sessão de login funcionando. Não usamos cookies de
        rastreamento publicitário ou de terceiros.
      </p>
      <p>
        Para a equipe saber quantas pessoas estão no site em cada momento, o
        navegador informa de forma <strong>anônima</strong> apenas a área do
        site em que você está (por exemplo, &ldquo;catálogo&rdquo; ou
        &ldquo;carrinho&rdquo;). Essa informação não contém nome, e-mail ou
        qualquer identificador seu e não é gravada: ela some assim que você
        fecha a página.
      </p>

      <h2>5. Por quanto tempo guardamos seus dados</h2>
      <p>
        Guardamos os dados do pedido pelo prazo exigido pela legislação
        fiscal e consumerista brasileira. Dados de conta são mantidos
        enquanto sua conta existir, ou até você solicitar a exclusão.
      </p>

      <h2>6. Seus direitos (LGPD, art. 18)</h2>
      <p>Você pode, a qualquer momento:</p>
      <ul>
        <li>Confirmar se tratamos seus dados e acessá-los.</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
        <li>Solicitar a exclusão dos seus dados pessoais (disponível diretamente em &ldquo;Minha conta&rdquo;).</li>
        <li>Solicitar a portabilidade dos seus dados a outro fornecedor.</li>
        <li>Revogar o consentimento, quando aplicável.</li>
      </ul>
      <p>
        Para exercer esses direitos, use a opção de exclusão em{" "}
        <a href="/minha-conta" className="text-rose-dark underline">
          Minha conta
        </a>{" "}
        ou entre em contato: {contato}.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Usamos controle de acesso por papéis (RLS no banco de dados),
        conexão HTTPS, e nunca armazenamos dados de cartão de crédito em
        nossos servidores.
      </p>

      <h2>8. Encarregado de dados (DPO)</h2>
      <p>
        [REVISAR: indicar nome/e-mail do encarregado de proteção de dados,
        conforme exigido pela LGPD, art. 41.]
      </p>

      <h2>9. Alterações desta política</h2>
      <p>
        Podemos atualizar esta política periodicamente. A versão vigente é
        sempre a publicada nesta página.
      </p>
    </LegalLayout>
  );
}

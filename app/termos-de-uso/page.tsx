import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { formatCompanyLine, getCompanyInfo } from "@/lib/legal/company-info";

export const metadata: Metadata = { title: "Termos de Uso" };

export default async function TermsOfUsePage() {
  const company = await getCompanyInfo();
  const razaoSocial = formatCompanyLine(company, "razao_social", "a razão social");
  // CNPJ/CPF e endereço só aparecem quando preenchidos (hoje ficam vazios).
  const cnpjOuCpf = company.cnpj_ou_cpf?.trim();
  const endereco = company.endereco?.trim();
  const contato = formatCompanyLine(company, "contato", "o contato");

  return (
    <LegalLayout title="Termos de Uso" updatedAt="06 de outubro de 2026">
      <p>
        Estes Termos de Uso regulam o acesso e a utilização do site Chrys
        Store, operado por <strong>{razaoSocial}</strong>
        {cnpjOuCpf && (
          <>
            , inscrita sob <strong>{cnpjOuCpf}</strong>
          </>
        )}
        {endereco && (
          <>
            , com endereço em <strong>{endereco}</strong>
          </>
        )}{" "}
        (&ldquo;Chrys Store&rdquo;, &ldquo;nós&rdquo;). A Chrys Store é uma loja
        virtual. Contato: <strong>{contato}</strong>.
      </p>
      <p>
        Ao navegar ou realizar uma compra neste site, você concorda com os
        termos abaixo. Se não concordar, pedimos que não utilize o site.
      </p>

      <h2>1. Objeto</h2>
      <p>
        O site destina-se à venda de acessórios, itens de casa e decoração e
        kits de presente (mimos) diretamente ao consumidor, com entrega em todo
        o território brasileiro.
      </p>

      <h2>2. Cadastro e conta de usuário</h2>
      <p>
        É possível comprar como visitante ou criar uma conta. Ao se
        cadastrar, você declara ter 18 anos ou mais (ou estar assistido por
        um responsável legal) e se compromete a fornecer informações
        verdadeiras, completas e atualizadas. Você é responsável por manter
        a confidencialidade da sua senha.
      </p>

      <h2>3. Pedidos, preços e pagamento</h2>
      <ul>
        <li>
          O preço de cada produto, o valor do frete e o total do pedido são
          exibidos de forma clara antes da confirmação do pagamento, como
          exige o Código de Defesa do Consumidor.
        </li>
        <li>
          Aceitamos pagamento via Pix (com confirmação verificada pela
          nossa equipe) e cartão de crédito, processado pelo Mercado Pago.
          Não armazenamos dados de cartão em nossos servidores.
        </li>
        <li>
          A disponibilidade de estoque é confirmada no momento da compra; em
          caso de indisponibilidade após a compra, você será reembolsado
          integralmente.
        </li>
        <li>
          O pedido é considerado confirmado somente após a aprovação do
          pagamento (cartão) ou a verificação do comprovante (Pix).
        </li>
      </ul>

      <h2>4. Trocas, devoluções e garantia</h2>
      <p>
        Condições detalhadas estão na nossa{" "}
        <a href="/politica-de-trocas-e-devolucoes" className="text-rose-dark underline">
          Política de Trocas e Devoluções
        </a>
        , incluindo o direito de arrependimento de 7 dias previsto no
        Código de Defesa do Consumidor e no Decreto nº 7.962/2013.
      </p>

      <h2>5. Uso aceitável do site</h2>
      <p>
        É proibido usar o site para fins ilícitos, tentar acessar áreas
        restritas sem autorização, interferir no funcionamento do site ou
        reproduzir seu conteúdo sem permissão.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        Marca, logotipo, textos, fotos e demais conteúdos do site pertencem
        à Chrys Store ou a seus licenciantes, sendo proibida a reprodução
        sem autorização prévia.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        Fazemos esforços razoáveis para manter o site disponível e as
        informações corretas, mas não garantimos ausência total de erros ou
        interrupções. Não respondemos por danos indiretos decorrentes do uso
        do site, salvo nos casos previstos em lei.
      </p>

      <h2>8. Alterações destes termos</h2>
      <p>
        Podemos atualizar estes Termos de Uso a qualquer momento. A versão
        vigente é sempre a publicada nesta página, com a data de
        atualização indicada no topo.
      </p>

      <h2>9. Foro e legislação aplicável</h2>
      <p>
        Estes termos são regidos pela legislação brasileira. Fica eleito o
        foro do domicílio do consumidor para dirimir eventuais
        controvérsias, conforme o Código de Defesa do Consumidor.{" "}
        [REVISAR: confirmar comarca/foro específico, se aplicável.]
      </p>

      <h2>10. Contato</h2>
      <p>Dúvidas sobre estes termos: {contato}.</p>
    </LegalLayout>
  );
}

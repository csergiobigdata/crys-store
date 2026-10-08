import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { formatCompanyLine, getCompanyInfo } from "@/lib/legal/company-info";

export const metadata: Metadata = { title: "Política de Trocas e Devoluções" };

export default async function ReturnsPolicyPage() {
  const company = await getCompanyInfo();
  const contato = formatCompanyLine(company, "contato", "o contato");

  return (
    <LegalLayout title="Política de Trocas e Devoluções" updatedAt="06 de outubro de 2026">
      <h2>1. Direito de arrependimento (compra online)</h2>
      <p>
        Como a compra é feita fora do estabelecimento físico, você tem até{" "}
        <strong>7 (sete) dias corridos</strong> a partir do recebimento do
        produto para desistir da compra, sem precisar justificar o motivo —
        é o direito de arrependimento previsto no art. 49 do Código de
        Defesa do Consumidor e no Decreto nº 7.962/2013.
      </p>
      <ul>
        <li>O produto deve ser devolvido sem sinais de uso, com embalagem e etiquetas, quando aplicável.</li>
        <li>O reembolso inclui o valor do produto e do frete de ida.</li>
        <li>Nesse caso, o frete de devolução é por nossa conta.</li>
      </ul>

      <h2>2. Produto com defeito</h2>
      <p>
        Produtos com defeito de fabricação têm garantia legal de 90 dias
        (CDC, art. 26) a partir do recebimento, para bens duráveis. Entre
        em contato com o número do pedido e fotos do problema — vamos
        avaliar troca, reparo ou reembolso, conforme o caso.
      </p>

      <h2>3. Troca por outro motivo (tamanho, cor, etc.)</h2>
      <p>
        [REVISAR: definir se a loja aceita troca por preferência pessoal
        além do prazo de arrependimento, prazo para isso e quem paga o
        frete de devolução nesse caso.]
      </p>

      <h2>4. Como solicitar</h2>
      <p>
        Entre em contato informando o número do pedido: {contato}. Nossa
        equipe vai te passar as instruções de devolução.
      </p>

      <h2>5. Prazo e forma de reembolso</h2>
      <p>
        O reembolso é feito pelo mesmo meio de pagamento usado na compra:
      </p>
      <ul>
        <li>
          <strong>Pix</strong>: devolvido para a chave Pix informada por
          você, em até [REVISAR: prazo] dia(s) úteis após recebermos o
          produto de volta.
        </li>
        <li>
          <strong>Cartão de crédito</strong>: estornado pelo Mercado Pago;
          o prazo para aparecer na fatura depende da sua operadora de
          cartão (normalmente 1 a 2 faturas).
        </li>
      </ul>
    </LegalLayout>
  );
}

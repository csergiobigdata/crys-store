import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { formatCompanyLine, getCompanyInfo } from "@/lib/legal/company-info";

export const metadata: Metadata = { title: "Política de Entrega" };

export default async function ShippingPolicyPage() {
  const company = await getCompanyInfo();
  const contato = formatCompanyLine(company, "contato", "o contato");

  return (
    <LegalLayout title="Política de Entrega" updatedAt="06 de outubro de 2026">
      <h2>1. Área de entrega</h2>
      <p>Entregamos para todo o território brasileiro.</p>

      <h2>2. Cálculo e valor do frete</h2>
      <p>
        O valor do frete é calculado no checkout a partir do seu CEP, de
        forma clara e antes da confirmação do pagamento, e aparece
        destacado no resumo do pedido.
      </p>

      <h2>3. Transportadora e prazo</h2>
      <p>
        [REVISAR: indicar transportadora(s)/Correios usada(s) e prazo
        estimado de entrega por região.]
      </p>
      <p>
        Pedidos pagos via Pix são postados após a confirmação manual do
        pagamento pela nossa equipe. Pedidos no cartão são postados após a
        aprovação automática pelo Mercado Pago.
      </p>

      <h2>4. Rastreamento</h2>
      <p>
        Assim que o pedido é postado, você recebe um e-mail com o código de
        rastreio, também disponível na página do seu pedido.
      </p>

      <h2>5. Ausência no momento da entrega</h2>
      <p>
        Caso não haja ninguém para receber o produto, a transportadora
        seguirá seu próprio procedimento de novas tentativas ou retirada em
        agência [REVISAR: confirmar com a transportadora escolhida].
      </p>

      <h2>6. Extravio ou avaria</h2>
      <p>
        Se o produto chegar danificado ou não chegar no prazo informado,
        entre em contato com o número do pedido: {contato}. Vamos resolver
        com reenvio ou reembolso, conforme o caso.
      </p>
    </LegalLayout>
  );
}

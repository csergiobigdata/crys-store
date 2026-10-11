import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Ajuda",
  description: "Central de ajuda da Chrys Store: como comprar, pagar, acompanhar pedidos e usar o painel.",
};

type Topic = { question: string; answer: ReactNode };

const customerTopics: { title: string; items: Topic[] }[] = [
  {
    title: "Comprando",
    items: [
      {
        question: "Como faço uma compra?",
        answer: (
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Escolha o produto no <Link href="/catalogo">catálogo</Link>, selecione a variação (se
              houver) e adicione ao carrinho.
            </li>
            <li>
              Abra o <Link href="/carrinho">carrinho</Link>, confira os itens e, se tiver, aplique um
              cupom de desconto.
            </li>
            <li>Siga para o checkout, informe os dados de entrega e escolha a forma de pagamento.</li>
            <li>Finalize o pedido e acompanhe-o em &ldquo;Meus pedidos&rdquo;.</li>
          </ol>
        ),
      },
      {
        question: "Preciso ter conta para comprar?",
        answer: (
          <p>
            Ter conta facilita: seus dados de entrega ficam salvos e você acompanha todos os pedidos
            em um só lugar. <Link href="/cadastro">Crie sua conta</Link> em poucos segundos.
          </p>
        ),
      },
      {
        question: "Como funciona o cupom de desconto?",
        answer: (
          <p>
            Digite o código do cupom no carrinho. Cada cupom tem validade e limite de uso, e cada
            cliente pode usar o mesmo cupom uma única vez.
          </p>
        ),
      },
    ],
  },
  {
    title: "Pagamento",
    items: [
      {
        question: "Como pago com Pix?",
        answer: (
          <p>
            No checkout, escolha Pix: o app mostra o QR Code e o código &ldquo;copia e cola&rdquo;.
            Pague no aplicativo do seu banco e anexe o comprovante (foto, print ou PDF). Nossa equipe
            confere e confirma o pagamento; você acompanha a situação na página do pedido. Pague
            dentro do prazo mostrado no pedido, senão ele expira.
          </p>
        ),
      },
      {
        question: "Posso pagar com cartão de crédito?",
        answer: <p>Ainda não. O cartão em até 6x chega em breve; por enquanto aceitamos Pix.</p>,
      },
      {
        question: "Meu comprovante foi recusado. E agora?",
        answer: (
          <p>
            Acontece quando o comprovante não confere com o pedido (valor, data ou favorecido). Envie
            um comprovante correto ou fale com a gente em{" "}
            <Link href="/fale-conosco">Fale Conosco</Link>, informando o número do pedido.
          </p>
        ),
      },
    ],
  },
  {
    title: "Entrega e pedidos",
    items: [
      {
        question: "Como acompanho meu pedido?",
        answer: (
          <p>
            Entre na sua conta e abra <Link href="/minha-conta/pedidos">Meus pedidos</Link>. Lá estão
            o status, os itens e, depois da postagem, o código de rastreio.
          </p>
        ),
      },
      {
        question: "Qual o valor e o prazo do frete?",
        answer: (
          <p>
            O frete é calculado no checkout a partir do seu CEP, antes de você pagar. Detalhes na{" "}
            <Link href="/politica-de-entrega">Política de Entrega</Link>.
          </p>
        ),
      },
      {
        question: "Posso trocar ou devolver um produto?",
        answer: (
          <p>
            Sim. Você tem 7 dias corridos após o recebimento para desistir da compra (direito de
            arrependimento) e a garantia legal para defeitos. Veja as regras em{" "}
            <Link href="/politica-de-trocas-e-devolucoes">Trocas e Devoluções</Link>.
          </p>
        ),
      },
    ],
  },
  {
    title: "Minha conta",
    items: [
      {
        question: "Esqueci minha senha.",
        answer: (
          <p>
            Na tela de <Link href="/entrar">entrar</Link>, clique em &ldquo;Esqueci minha
            senha&rdquo;. Enviaremos um link de uso único, válido por 1 hora, para você criar uma
            nova senha.
          </p>
        ),
      },
      {
        question: "Por que fui desconectado sozinho?",
        answer: (
          <p>
            Por segurança, a sessão termina depois de 15 minutos sem nenhuma atividade no site. É só
            entrar de novo.
          </p>
        ),
      },
      {
        question: "Como altero meus dados ou excluo minha conta?",
        answer: (
          <p>
            Em <Link href="/minha-conta">Dados de contato</Link> você edita nome, apelido, telefone e
            endereço de entrega, e também pode excluir a conta. Seus dados são tratados conforme a{" "}
            <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
          </p>
        ),
      },
    ],
  },
];

const adminTopics: Topic[] = [
  {
    question: "Como cadastro um produto?",
    answer: (
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          Em <Link href="/admin/produtos/novo">Produtos → Novo produto</Link>, preencha nome, slug,
          descrição, preço base e categoria, e salve (todo produto novo nasce Ativo).
        </li>
        <li>Na tela do produto, adicione as fotos e, se houver, as variações com estoque.</li>
        <li>
          Marque &ldquo;Produto de teste&rdquo; apenas enquanto estiver avaliando o produto ou
          testando o app.
        </li>
      </ol>
    ),
  },
  {
    question: "Como confirmo um pagamento Pix?",
    answer: (
      <p>
        Em <Link href="/admin/pedidos">Pedidos</Link>, abra o pedido, confira o comprovante e
        confirme ou recuse o Pix. Os pedidos aguardando conferência aparecem no card
        &ldquo;Comprovantes Pix em análise&rdquo; da Visão geral.
      </p>
    ),
  },
  {
    question: "Como envio ou cancelo um pedido?",
    answer: (
      <p>
        No pedido, use &ldquo;marcar como enviado&rdquo; ou &ldquo;cancelar&rdquo;, que exige
        justificativa. Cancelar não devolve o dinheiro de pedido já pago: o reembolso é manual.
        Pedidos cancelados não entram no card &ldquo;Pedidos ativos&rdquo;.
      </p>
    ),
  },
  {
    question: "Como crio cupons e categorias?",
    answer: (
      <p>
        Em <Link href="/admin/cupons">Cupons</Link>: nome (até 10 caracteres), código (até 15), valor
        fixo ou percentual (teto de 30% do valor dos produtos) e limite de uso. Em{" "}
        <Link href="/admin/categorias">Categorias</Link> você cria, renomeia, ativa/desativa e
        exclui.
      </p>
    ),
  },
  {
    question: "Onde ajusto frete, chave Pix e dados da empresa?",
    answer: (
      <p>
        Em <Link href="/admin/configuracoes">Configurações</Link>: chave Pix, prazo do Pix, faixas de
        frete, entrega local e dados da empresa.
      </p>
    ),
  },
  {
    question: "Onde leio as mensagens dos clientes?",
    answer: (
      <p>
        Em <Link href="/admin/mensagens">Mensagens</Link>, com o resultado do envio por e-mail. Para
        ver quem mudou o quê, use a <Link href="/admin/auditoria">Auditoria</Link>.
      </p>
    ),
  },
];

function TopicList({ items }: { items: Topic[] }) {
  return (
    <div className="divide-y divide-rose-light overflow-hidden rounded-2xl border border-rose-light bg-surface shadow-card">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-plum">
            {item.question}
            <span
              aria-hidden="true"
              className="text-lg leading-none text-rose-dark transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="mt-3 text-sm leading-relaxed text-plum-soft [&_a]:font-medium [&_a]:text-rose-dark [&_a]:hover:underline">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

export default async function HelpPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">Ajuda</h1>
      <p className="mt-2 text-plum-soft">
        Respostas para as dúvidas mais comuns. Não achou o que procurava? Fale com a gente em{" "}
        <Link href="/fale-conosco" className="font-medium text-rose-dark hover:underline">
          Fale Conosco
        </Link>
        .
      </p>

      <div className="mt-8 space-y-8">
        {customerTopics.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 font-display text-xl font-semibold text-plum">{group.title}</h2>
            <TopicList items={group.items} />
          </section>
        ))}

        {isAdmin && (
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-plum">
              Para administradores
            </h2>
            <TopicList items={adminTopics} />
          </section>
        )}
      </div>
    </div>
  );
}
